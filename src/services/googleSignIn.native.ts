import Constants from 'expo-constants';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseServices } from './firebase';
export async function googleSignIn(): Promise<void> {
  if (Constants.appOwnership === 'expo') throw new Error('Google requiere el APK de desarrollo. En Expo Go puedes utilizar correo y contraseña.');
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!clientId) throw new Error('Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en .env.');
  const { GoogleSignin } = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ webClientId: clientId, iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  if (result.type !== 'success') throw new Error('Inicio con Google cancelado.');
  if (!result.data.idToken) throw new Error('Google no devolvió un ID token. Revisa cliente OAuth y SHA-1.');
  await signInWithCredential(firebaseServices().auth, GoogleAuthProvider.credential(result.data.idToken));
}
