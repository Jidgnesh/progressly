// ============================================
// FIREBASE CONFIGURATION
// ============================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBfPKPTGvduOK3nU8eqsqivxNs--drccek",
  authDomain: "progrey-515c9.firebaseapp.com",
  projectId: "progrey-515c9",
  storageBucket: "progrey-515c9.firebasestorage.app",
  messagingSenderId: "14575284602",
  appId: "1:14575284602:web:93495b9c3cd91288a226c3",
  measurementId: "G-J49G944Q67"
};

// Initialize Firebase (using compat mode for easier integration)
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    window.firebaseAuth = firebase.auth();
    window.firebaseDb = firebase.firestore();

    // Set auth persistence to LOCAL — survives browser restarts on all devices
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .catch((err) => {
        console.warn('Failed to set auth persistence:', err);
      });

    // Force Firestore to go online
    firebase.firestore().enableNetwork()
      .then(() => {
        console.log('Firestore is online');
      })
      .catch((err) => {
        console.warn('Failed to enable Firestore network:', err);
      });

    // Enable Firestore offline persistence (allows offline reads/writes)
    firebase.firestore().enablePersistence()
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore persistence not supported in this browser');
        } else {
          console.warn('Firestore persistence error:', err);
        }
      });

  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}
