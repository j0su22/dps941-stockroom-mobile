import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, initializeAuth, getAuth, browserLocalPersistence } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import * as FirebaseAuth from 'firebase/auth';
import type { Persistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

let connected = false;
export function firebaseServices() {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  if (!config.apiKey || !config.projectId || !config.appId) throw new Error('Configura .env con los datos de tu proyecto Firebase. Consulta docs/CONFIGURACION_FIREBASE.md.');
  const app = getApps().length ? getApp() : initializeApp(config);
  let auth;
  try {
    auth = initializeAuth(app, { persistence: Platform.OS === 'web' ? browserLocalPersistence : (FirebaseAuth as unknown as { getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence }).getReactNativePersistence(AsyncStorage) });
  } catch (e) {
    if ((e as { code?: string }).code !== 'auth/already-initialized') throw e;
    auth = getAuth(app);
  }
  const services = { auth, db: initializeFirestore(app, { experimentalAutoDetectLongPolling: true }) };
  const host = process.env.EXPO_PUBLIC_EMULATOR_HOST;
  if (__DEV__ && host && !connected) {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(services.db, host, 8080);
    connected = true;
  }
  return services;
}
