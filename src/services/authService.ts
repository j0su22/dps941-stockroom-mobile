import { EmailAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, reauthenticateWithCredential, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updatePassword, updateProfile } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { normalizeEmail, validateEmail, validateName, validatePassword } from '../domain/validation';
import type { User } from '../types/models';
import { firebaseServices } from './firebase';
import { googleSignIn } from './googleSignIn';

async function profile(): Promise<User> {
  const { auth, db } = firebaseServices();
  const current = auth.currentUser;
  if (!current) throw new Error('Inicia sesión para continuar.');
  const reference = doc(db, 'users', current.uid);
  let snapshot = await getDoc(reference);
  if (!snapshot.exists()) {
    const user: User = { id: current.uid, name: (current.displayName || current.email?.split('@')[0] || 'Técnico').slice(0, 80), email: current.email || '', role: 'TECHNICIAN', active: true };
    await setDoc(reference, user);
    snapshot = await getDoc(reference);
  }
  const user = snapshot.data() as User;
  if (!user.active) throw new Error('Tu cuenta está inactiva. Contacta a administración.');
  return user;
}
export const authService = {
  async initialize(): Promise<User | null> {
    const { auth } = firebaseServices();
    await auth.authStateReady();
    return auth.currentUser ? profile() : null;
  },
  observe(listener: (user: User | null) => void, error: (e: unknown) => void) {
    return onAuthStateChanged(firebaseServices().auth, u => {
      if (!u) listener(null);
      else void profile().then(p => { if (firebaseServices().auth.currentUser?.uid === p.id) listener(p); }).catch(error);
    }, error);
  },
  async login(email: string, password: string, _remember: boolean): Promise<User> {
    const error = validateEmail(email); if (error) throw new Error(error);
    await signInWithEmailAndPassword(firebaseServices().auth, normalizeEmail(email), password);
    return profile();
  },
  async google(): Promise<User> { await googleSignIn(); return profile(); },
  async register(name: string, email: string, password: string, confirmation: string): Promise<User> {
    const error = validateName(name) || validateEmail(email) || validatePassword(password) || (password !== confirmation ? 'Las contraseñas no coinciden.' : undefined);
    if (error) throw new Error(error);
    const { user } = await createUserWithEmailAndPassword(firebaseServices().auth, normalizeEmail(email), password);
    await updateProfile(user, { displayName: name.trim() });
    // onAuthStateChanged puede crear el perfil antes de terminar updateProfile.
    await profile();
    await setDoc(doc(firebaseServices().db, 'users', user.uid), { name: name.trim() }, { merge: true });
    return profile();
  },
  requireUser: profile,
  async getUsers(): Promise<User[]> {
    await profile();
    return (await getDocs(collection(firebaseServices().db, 'users'))).docs.map(d => d.data() as User);
  },
  async resetPassword(email: string) {
    const error = validateEmail(email); if (error) throw new Error(error);
    await sendPasswordResetEmail(firebaseServices().auth, normalizeEmail(email));
  },
  async logout() { await signOut(firebaseServices().auth); },
  async changePassword(oldPassword: string, password: string, confirmation: string) {
    const error = validatePassword(password) || (password !== confirmation ? 'Las contraseñas no coinciden.' : undefined);
    if (error) throw new Error(error);
    const { currentUser } = firebaseServices().auth;
    if (!currentUser?.email) throw new Error('No hay una sesión activa.');
    if (!currentUser.providerData.some(p => p.providerId === 'password')) throw new Error('Tu cuenta utiliza Google. Administra la contraseña desde tu cuenta Google.');
    await reauthenticateWithCredential(currentUser, EmailAuthProvider.credential(currentUser.email, oldPassword));
    await updatePassword(currentUser, password);
  },
};
