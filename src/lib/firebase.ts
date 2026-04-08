import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableNetwork, enableIndexedDbPersistence } from 'firebase/firestore';

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
export const db = getFirestore(app);

// Set auth persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Failed to set auth persistence:', err);
});

// Enable Firestore network
enableNetwork(db).catch((err) => {
  console.warn('Failed to enable Firestore network:', err);
});

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not supported');
  }
});
