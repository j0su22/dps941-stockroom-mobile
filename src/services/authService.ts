import * as Crypto from 'expo-crypto';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { demoUsers } from '../data/seed';
import { normalizeEmail, validateEmail, validateName, validatePassword } from '../domain/validation';
import type { User } from '../types/models';
import { exclusive, sessionStorage, storage } from './storage';

interface Account extends User { salt: string; passwordHash: string }
interface Session { userId: string; expiresAt: number }
const ACCOUNT_KEY = 'stockroom-accounts-v1';
const DEMO_PASSWORD = 'Stockroom2026!';
let currentSession: Session | null = null;
const toUser = ({ id, name, email, role, active }: Account): User => ({ id, name, email, role, active });
const hashPassword = async (password: string, salt: string) => bytesToHex(await pbkdf2Async(sha256, password, hexToBytes(salt), { c: 100_000, dkLen: 32 }));
async function makeAccount(user: User, password: string): Promise<Account> {
  const salt = bytesToHex(await Crypto.getRandomBytesAsync(16));
  return { ...user, salt, passwordHash: await hashPassword(password, salt) };
}
async function accounts(): Promise<Account[]> {
  const stored = await storage.read<Account[]>(ACCOUNT_KEY);
  if (!Array.isArray(stored) || stored.some(a => !a.id || !a.salt || !a.passwordHash)) throw new Error('Las cuentas locales no están disponibles. Reinicia la aplicación o revisa el almacenamiento.');
  return stored;
}
async function requireUser(): Promise<User> {
  if (!currentSession || currentSession.expiresAt <= Date.now()) {
    currentSession = null;
    await sessionStorage.clear();
    throw new Error('La sesión expiró. Cierra sesión y vuelve a ingresar.');
  }
  const account = (await accounts()).find(a => a.id === currentSession!.userId && a.active);
  if (!account) throw new Error('No tienes una sesión activa.');
  return toUser(account);
}
async function openSession(user: User, remember: boolean): Promise<User> {
  const session = { userId: user.id, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
  if (remember) await sessionStorage.set(JSON.stringify(session));
  else await sessionStorage.clear();
  currentSession = session;
  return user;
}

export const authService = {
  async initialize(): Promise<User | null> {
    await exclusive(async () => {
      if (!(await storage.read<Account[]>(ACCOUNT_KEY))) {
        const initial: Account[] = [];
        for (const u of demoUsers) initial.push(await makeAccount(u, DEMO_PASSWORD));
        await storage.write(ACCOUNT_KEY, initial);
      }
    });
    const saved = await sessionStorage.get();
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved) as Session;
      if (typeof parsed.userId !== 'string' || typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= Date.now()) throw new Error('expired');
      currentSession = parsed;
      return await requireUser();
    } catch {
      currentSession = null;
      await sessionStorage.clear();
      return null;
    }
  },
  async login(email: string, password: string, remember: boolean): Promise<User> {
    const error = validateEmail(email);
    if (error) throw new Error(error);
    const account = (await accounts()).find(u => u.email === normalizeEmail(email) && u.active);
    if (!account || password.length > 128 || account.passwordHash !== await hashPassword(password, account.salt)) throw new Error('Correo o contraseña incorrectos.');
    return openSession(toUser(account), remember);
  },
  async register(name: string, email: string, password: string, confirm: string): Promise<User> {
    const error = validateName(name) || validateEmail(email) || validatePassword(password) || (password !== confirm ? 'Las contraseñas no coinciden.' : undefined);
    if (error) throw new Error(error);
    return exclusive(async () => {
      const all = await accounts();
      if (all.some(u => u.email === normalizeEmail(email))) throw new Error('Ya existe una cuenta con este correo.');
      const account = await makeAccount({ id: Crypto.randomUUID(), name: name.trim(), email: normalizeEmail(email), role: 'TECHNICIAN', active: true }, password);
      await storage.write(ACCOUNT_KEY, [...all, account]);
      return openSession(toUser(account), false);
    });
  },
  requireUser,
  async getUsers(): Promise<User[]> { await requireUser(); return (await accounts()).map(toUser); },
  async logout(): Promise<void> { await sessionStorage.clear(); currentSession = null; },
  async changePassword(oldPassword: string, password: string, confirmation: string): Promise<void> {
    const user = await requireUser();
    const error = validatePassword(password) || (password !== confirmation ? 'Las contraseñas no coinciden.' : undefined);
    if (error) throw new Error(error);
    await exclusive(async () => {
      const all = await accounts();
      const old = all.find(a => a.id === user.id)!;
      if (await hashPassword(oldPassword, old.salt) !== old.passwordHash) throw new Error('La contraseña actual es incorrecta.');
      const replacement = await makeAccount(user, password);
      await storage.write(ACCOUNT_KEY, all.map(a => a.id === user.id ? replacement : a));
    });
  },
};
