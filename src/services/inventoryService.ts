import * as Crypto from 'expo-crypto';
import { createSeedDatabase } from '../data/seed';
import { applyMovement } from '../domain/inventory';
import type { Database, MovementInput } from '../types/models';
import { authService } from './authService';
import { exclusive, storage } from './storage';

const KEY = 'stockroom-database-v1';
async function readDatabase(): Promise<Database> {
  const db = await storage.read<Database>(KEY);
  if (db === null) {
    const seed = createSeedDatabase();
    await storage.write(KEY, seed);
    return seed;
  }
  if (db.version !== 1 || !Array.isArray(db.equipment) || !Array.isArray(db.projects) || !Array.isArray(db.assignments) || !Array.isArray(db.movements)) throw new Error('El inventario local tiene un formato incompatible.');
  return db;
}

export const inventoryService = {
  async load(): Promise<Database> { await authService.requireUser(); return exclusive(readDatabase); },
  async registerMovement(input: MovementInput): Promise<Database> {
    return exclusive(async () => {
      const actor = await authService.requireUser();
      const users = await authService.getUsers();
      const next = applyMovement(await readDatabase(), input, actor, users, Crypto.randomUUID(), new Date().toISOString());
      // Una escritura para stock + asignación + historial. Publicar estado solo después de persistir.
      await storage.write(KEY, next);
      return next;
    });
  },
  async addTechnician(projectId: string, technicianId: string): Promise<Database> {
    return exclusive(async () => {
      const actor = await authService.requireUser();
      if (actor.role !== 'ADMIN') throw new Error('Solo administración puede asignar técnicos a proyectos.');
      const db = await readDatabase();
      const project = db.projects.find(p => p.id === projectId && p.status !== 'CLOSED');
      const technician = (await authService.getUsers()).find(u => u.id === technicianId && u.active && u.role === 'TECHNICIAN');
      if (!project || !technician) throw new Error('Selecciona un proyecto activo y un técnico válido.');
      if (!project.technicianIds.includes(technicianId)) project.technicianIds.push(technicianId);
      await storage.write(KEY, db);
      return db;
    });
  },
};
