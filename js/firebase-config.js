// ============================================
// FIREBASE CONFIGURATION
// ============================================
// Replace these values with your Firebase project configuration
// Get them from: https://console.firebase.google.com/ > Project Settings > General

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (using compat mode for easier integration)
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(FIREBASE_CONFIG);
  window.firebaseAuth = firebase.auth();
  window.firebaseDb = firebase.firestore();
}
