import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const storage = {
  async read<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value === null ? null : JSON.parse(value) as T;
  },
  write: (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value)),
};

// Web solo es una vista de demostración; SecureStore protege la sesión en Android/iOS.
export const sessionStorage = {
  async get(): Promise<string | null> {
    return Platform.OS === 'web' ? globalThis.sessionStorage?.getItem('stockroom-session') ?? null : SecureStore.getItemAsync('stockroom-session');
  },
  async set(value: string): Promise<void> {
    if (Platform.OS === 'web') globalThis.sessionStorage.setItem('stockroom-session', value);
    else await SecureStore.setItemAsync('stockroom-session', value);
  },
  async clear(): Promise<void> {
    if (Platform.OS === 'web') globalThis.sessionStorage.removeItem('stockroom-session');
    else await SecureStore.deleteItemAsync('stockroom-session');
  },
};

// Serializa operaciones locales para evitar lecturas obsoletas y pérdidas por doble clic.
let queue: Promise<unknown> = Promise.resolve();
export function exclusive<T>(work: () => Promise<T>): Promise<T> {
  const result = queue.then(work, work);
  queue = result.catch(() => undefined);
  return result;
}
