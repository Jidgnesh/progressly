// ============================================
// FIREBASE SERVICE
// ============================================
// Handles all Firebase authentication and database operations

const FirebaseService = {
  // ==================== AUTHENTICATION ====================
  
  // Sign up with email and password
  signUp: async (email, password, name) => {
    try {
      // Ensure Firestore is online (non-blocking — don't fail signup if this errors)
      try {
        await firebase.firestore().enableNetwork();
      } catch (networkErr) {
        console.warn('enableNetwork failed, proceeding with signup:', networkErr.message);
      }

      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update user profile with name
      try {
        await user.updateProfile({ displayName: name });
      } catch (profileErr) {
        console.warn('Failed to update profile displayName:', profileErr.message);
      }

      // Create user document in Firestore
      try {
        await firebase.firestore().collection('users').doc(user.uid).set({
          name: name,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (firestoreError) {
        console.warn('Firestore document creation failed, will retry:', firestoreError.message);
        setTimeout(async () => {
          try {
            await firebase.firestore().collection('users').doc(user.uid).set({
              name: name,
              email: email,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          } catch (e) {
            console.error('Failed to create user document in background:', e);
          }
        }, 1000);
      }

      return { success: true, user: { uid: user.uid, email: user.email, name: name } };
    } catch (error) {
      // If email is already in use, the user may have been created in a previous
      // failed attempt. Try signing them in automatically.
      if (error.code === 'auth/email-already-in-use') {
        try {
          const signInResult = await FirebaseService.signIn(email, password);
          if (signInResult.success) {
            // Update name if needed
            const user = firebase.auth().currentUser;
            if (user && !user.displayName) {
              try { await user.updateProfile({ displayName: name }); } catch (e) {}
            }
            return signInResult;
          }
        } catch (signInErr) {
          // Sign-in also failed — the email genuinely belongs to someone else
        }
        return { success: false, error: 'This email is already registered. Please sign in instead.' };
      }

      let errorMessage = error.message;
      if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check and try again.';
      } else if (error.message && error.message.includes('offline')) {
        errorMessage = 'You appear to be offline. Please check your internet connection and try again.';
      }
      return { success: false, error: errorMessage };
    }
  },
  
  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Get user data from Firestore (graceful fallback if offline)
      let userName = user.displayName || 'User';
      try {
        await FirebaseService.ensureOnline();
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        if (userData?.name) userName = userData.name;
      } catch (firestoreErr) {
        console.warn('Could not fetch user document during sign-in, using auth profile:', firestoreErr.message);
      }

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          name: userName
        }
      };
    } catch (error) {
      let errorMessage = error.message;
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      }
      return { success: false, error: errorMessage };
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();

      // Try popup first, fall back to redirect if it fails
      let user;
      try {
        const userCredential = await firebase.auth().signInWithPopup(provider);
        user = userCredential.user;
      } catch (popupErr) {
        // Popup blocked, closed, or session storage issue — use redirect
        if (popupErr.code === 'auth/popup-blocked' ||
            popupErr.code === 'auth/popup-closed-by-user' ||
            popupErr.code === 'auth/cancelled-popup-request' ||
            popupErr.message.includes('sessionStorage') ||
            popupErr.message.includes('initial state')) {
          await firebase.auth().signInWithRedirect(provider);
          return { success: true, redirect: true };
        }
        throw popupErr;
      }

      // Create user document in Firestore (graceful if offline)
      try {
        await FirebaseService.ensureOnline();
        const userRef = firebase.firestore().collection('users').doc(user.uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          await userRef.set({
            name: user.displayName,
            email: user.email,
            picture: user.photoURL,
            provider: 'google',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (firestoreErr) {
        console.warn('Could not access Firestore during Google sign-in, using auth profile:', firestoreErr.message);
      }

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          picture: user.photoURL
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Sign out
  signOut: async () => {
    try {
      await firebase.auth().signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Get current user
  getCurrentUser: () => {
    return firebase.auth().currentUser;
  },
  
  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    return firebase.auth().onAuthStateChanged(callback);
  },
  
  // Reset password
  resetPassword: async (email) => {
    try {
      await firebase.auth().sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Update password
  updatePassword: async (newPassword) => {
    try {
      const user = firebase.auth().currentUser;
      if (!user) {
        return { success: false, error: 'No user signed in' };
      }
      await user.updatePassword(newPassword);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // ==================== FIRESTORE (TASKS) ====================

  // Ensure Firestore is online before operations
  ensureOnline: async () => {
    try {
      await firebase.firestore().enableNetwork();
    } catch (e) {
      console.warn('Could not enable Firestore network:', e.message);
    }
  },

  // Get user's tasks
  getTasks: async (userId) => {
    try {
      await FirebaseService.ensureOnline();
      const tasksRef = firebase.firestore().collection('users').doc(userId).collection('tasks');
      const snapshot = await tasksRef.orderBy('updatedAt', 'desc').get();
      
      const tasks = [];
      snapshot.forEach(doc => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, tasks };
    } catch (error) {
      return { success: false, error: error.message, tasks: [] };
    }
  },
  
  // Save tasks
  saveTasks: async (userId, tasks) => {
    try {
      await FirebaseService.ensureOnline();
      const batch = firebase.firestore().batch();
      const tasksRef = firebase.firestore().collection('users').doc(userId).collection('tasks');
      
      // Delete all existing tasks
      const snapshot = await tasksRef.get();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Add all new tasks
      tasks.forEach(task => {
        const { id, ...taskData } = task;
        const taskRef = tasksRef.doc(id || tasksRef.doc().id);
        batch.set(taskRef, {
          ...taskData,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Get user's trash
  getTrash: async (userId) => {
    try {
      await FirebaseService.ensureOnline();
      const trashRef = firebase.firestore().collection('users').doc(userId).collection('trash');
      const snapshot = await trashRef.orderBy('deletedAt', 'desc').get();
      
      const trash = [];
      snapshot.forEach(doc => {
        trash.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, trash };
    } catch (error) {
      return { success: false, error: error.message, trash: [] };
    }
  },
  
  // Save trash
  saveTrash: async (userId, trash) => {
    try {
      await FirebaseService.ensureOnline();
      const batch = firebase.firestore().batch();
      const trashRef = firebase.firestore().collection('users').doc(userId).collection('trash');
      
      // Delete all existing trash
      const snapshot = await trashRef.get();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Add all new trash items
      trash.forEach(item => {
        const { id, ...itemData } = item;
        const itemRef = trashRef.doc(id || trashRef.doc().id);
        batch.set(itemRef, {
          ...itemData,
          deletedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Real-time listener for tasks
  subscribeToTasks: (userId, callback) => {
    const tasksRef = firebase.firestore()
      .collection('users').doc(userId).collection('tasks');
    
    return tasksRef.onSnapshot(
      (snapshot) => {
        const tasks = [];
        snapshot.forEach(doc => {
          tasks.push({ id: doc.id, ...doc.data() });
        });
        callback(tasks);
      },
      (error) => {
        console.error('Error listening to tasks:', error);
        callback([]);
      }
    );
  }
};
