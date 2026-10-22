import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { inventoryService } from '../services/inventoryService';
import { authService } from '../services/authService';
import { errorMessage } from '../domain/validation';
import type { Database, MovementInput, User } from '../types/models';

interface InventoryState {
  db: Database | null;
  users: User[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  save: (input: MovementInput) => Promise<void>;
  addTechnician: (projectId: string, technicianId: string) => Promise<void>;
}
const Context = createContext<InventoryState | null>(null);
export function InventoryProvider({ children }: React.PropsWithChildren) {
  const [db, setDb] = useState<Database | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try { const [data, people] = await Promise.all([inventoryService.load(), authService.getUsers()]); setDb(data); setUsers(people); }
    catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return <Context.Provider value={{ db, users, loading, error, refresh,
    save: async input => setDb(await inventoryService.registerMovement(input)),
    addTechnician: async (p, t) => setDb(await inventoryService.addTechnician(p, t)),
  }}>{children}</Context.Provider>;
}
export function useInventory() { const ctx = useContext(Context); if (!ctx) throw new Error('Falta InventoryProvider'); return ctx; }
