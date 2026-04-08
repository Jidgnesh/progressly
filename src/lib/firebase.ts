import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBfPKPTGvduOK3nU8eqsqivxNs--drccek",
  authDomain: "progrey-515c9.firebaseapp.com",
  projectId: "progrey-515c9",
  storageBucket: "progrey-515c9.firebasestorage.app",
  messagingSenderId: "14575284602",
  appId: "1:14575284602:web:93495b9c3cd91288a226c3",
  measurementId: "G-J49G944Q67",
};

const app = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);

// Initialize Firestore with persistent cache (replaces deprecated enableIndexedDbPersistence)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Set auth persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Failed to set auth persistence:', err);
});
