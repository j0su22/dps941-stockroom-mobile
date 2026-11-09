import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { firebaseServices } from './firebase';
export async function googleSignIn(): Promise<void> {
  await signInWithPopup(firebaseServices().auth, new GoogleAuthProvider());
}
