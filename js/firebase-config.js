const firebaseConfig = {
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
  firebase.initializeApp(firebaseConfig);
  window.firebaseAuth = firebase.auth();
  window.firebaseDb = firebase.firestore();
}
