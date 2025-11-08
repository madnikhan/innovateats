import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase only if we have valid config
let firebaseApp: FirebaseApp | undefined;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    firebaseApp = !getApps().length 
      ? initializeApp(firebaseConfig)
      : getApps()[0];
  } catch (error) {
    // During build, if Firebase can't initialize, we'll handle it gracefully
    if (typeof window === 'undefined') {
      // Build time - create a mock app to prevent errors
      console.warn('Firebase config missing during build - this is expected if env vars are not set');
    } else {
      throw error;
    }
  }
}

// Initialize Firebase services - will fail gracefully if app is not initialized
export const auth: Auth = firebaseApp ? getAuth(firebaseApp) : getAuth();
export const db: Firestore = firebaseApp ? getFirestore(firebaseApp) : getFirestore();
export default firebaseApp;

