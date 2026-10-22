import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { authService } from '../services/authService';
import { errorMessage } from '../domain/validation';
import type { User } from '../types/models';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string;
  initialize: () => Promise<void>;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, confirm: string) => Promise<void>;
  logout: () => Promise<void>;
}
const Context = createContext<AuthState | null>(null);
export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const initialize = useCallback(async () => {
    setLoading(true); setError('');
    try { setUser(await authService.initialize()); } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void initialize(); }, [initialize]);
  useEffect(() => {
    if (!user) return;
    const verify = () => { void authService.requireUser().catch(() => setUser(null)); };
    const timer = setInterval(verify, 60_000);
    const sub = AppState.addEventListener('change', state => { if (state === 'active') verify(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [user]);
  return <Context.Provider value={{ user, loading, error, initialize,
    login: async (e, p, r) => setUser(await authService.login(e, p, r)),
    register: async (n, e, p, c) => setUser(await authService.register(n, e, p, c)),
    logout: async () => { await authService.logout(); setUser(null); },
  }}>{children}</Context.Provider>;
}
export function useAuth() { const ctx = useContext(Context); if (!ctx) throw new Error('Falta AuthProvider'); return ctx; }
