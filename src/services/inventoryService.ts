import { collection, doc, getDocs, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import type { Database, MovementInput, User } from '../types/models';
import { applyMovement } from '../domain/inventory';
import { authService } from './authService';
import { firebaseServices } from './firebase';
const tables = ['equipment', 'projects', 'assignments', 'movements'] as const;
const pending = new Map<string, string>();
const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export const inventoryService = {
  async load(): Promise<Database> {
    const db = firebaseServices().db;
    const result: Database = { version: 1, equipment: [], projects: [], assignments: [], movements: [] };
    for (const name of tables) {
      const records = await getDocs(collection(db, name));
      (result[name] as unknown[]) = records.docs.map(s => s.data());
    }
    return result;
  },
  subscribe(next: (db: Database) => void, error: (e: unknown) => void) {
    const db = firebaseServices().db;
    const result: Database = { version: 1, equipment: [], projects: [], assignments: [], movements: [] };
    const ready = new Set<string>();
    const stops = tables.map(name => onSnapshot(collection(db, name), s => {
      (result[name] as unknown[]) = s.docs.map(d => d.data()); ready.add(name);
      if (ready.size === tables.length) next(clean(result));
    }, error));
    return () => stops.forEach(stop => stop());
  },
  async registerMovement(input: MovementInput): Promise<Database> {
    const actor = await authService.requireUser();
    const users = await authService.getUsers();
    const key = JSON.stringify({ ...input, evidenceUri: undefined, actor: actor.id });
    const id = pending.get(key) || Crypto.randomUUID(); pending.set(key, id);
    const db = firebaseServices().db;
    await runTransaction(db, async tx => {
      const movementRef = doc(db, 'movements', id);
      const equipmentRef = doc(db, 'equipment', input.equipmentId);
      const projectRef = doc(db, 'projects', input.projectId);
      const assignmentRef = doc(db, 'assignments', input.type === 'EXIT' ? `ASG-${id}` : input.assignmentId || 'invalid');
      const [existing, equipment, project, assignment, actorSnap, technician] = await Promise.all([
        tx.get(movementRef), tx.get(equipmentRef), tx.get(projectRef), tx.get(assignmentRef),
        tx.get(doc(db, 'users', actor.id)), tx.get(doc(db, 'users', input.technicianId)),
      ]);
      if (existing.exists()) return;
      if (!equipment.exists() || !project.exists()) throw new Error('Equipo o proyecto no disponible.');
      const state: Database = { version: 1, equipment: [equipment.data() as Database['equipment'][number]], projects: [project.data() as Database['projects'][number]], assignments: assignment.exists() ? [assignment.data() as Database['assignments'][number]] : [], movements: [] };
      const people = users.filter(u => u.id !== input.technicianId);
      if (technician.exists()) people.push(technician.data() as User);
      const next = applyMovement(state, clean(input), actorSnap.data() as User, people, id, new Date().toISOString());
      tx.set(equipmentRef, clean({ ...next.equipment[0], lastMovementId: id }));
      tx.set(assignmentRef, clean({ ...next.assignments[0], lastMovementId: id }));
      tx.set(movementRef, { ...clean(next.movements[0]), createdAt: serverTimestamp() });
    });
    const result = await this.load(); pending.delete(key); return result;
  },
  async addTechnician(projectId: string, technicianId: string): Promise<Database> {
    const actor = await authService.requireUser();
    const db = firebaseServices().db;
    await runTransaction(db, async tx => {
      const reference = doc(db, 'projects', projectId);
      const [p, t] = await Promise.all([tx.get(reference), tx.get(doc(db, 'users', technicianId))]);
      if (actor.role !== 'ADMIN') throw new Error('Solo administración puede asignar técnicos.');
      if (!p.exists() || p.data().status === 'CLOSED' || !t.exists() || !t.data().active || t.data().role !== 'TECHNICIAN') throw new Error('Proyecto o técnico no válido.');
      tx.update(reference, { technicianIds: Array.from(new Set([...p.data().technicianIds, technicianId])), addedTechnicianId: technicianId });
    });
    return this.load();
  },
};
