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

// Lazy initialization - only initialize when actually needed
let firebaseApp: FirebaseApp | null = null;

const getFirebaseApp = (): FirebaseApp => {
  if (!firebaseApp) {
    if (!getApps().length) {
      // Initialize Firebase - use config even if empty (for build compatibility)
      // This will fail at runtime if env vars are missing, but allows build to succeed
      try {
        firebaseApp = initializeApp(firebaseConfig);
      } catch (error) {
        // During build, if Firebase can't initialize, create a minimal app
        if (typeof window === 'undefined') {
          // Build time - initialize with minimal config to prevent errors
          firebaseApp = initializeApp({
            apiKey: 'build-time-placeholder',
            authDomain: 'build-time-placeholder',
            projectId: 'build-time-placeholder',
            storageBucket: 'build-time-placeholder',
            messagingSenderId: 'build-time-placeholder',
            appId: 'build-time-placeholder',
          });
        } else {
          throw error;
        }
      }
    } else {
      firebaseApp = getApps()[0];
    }
  }
  return firebaseApp;
};

// Lazy initialization of Firebase services - only initialize when accessed
let _auth: Auth | null = null;
let _db: Firestore | null = null;

export const auth: Auth = (() => {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
})();

export const db: Firestore = (() => {
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
})();

export default firebaseApp;

