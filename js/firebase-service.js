// ============================================
// FIREBASE SERVICE
// ============================================
// Handles all Firebase authentication and database operations

const FirebaseService = {
  // ==================== AUTHENTICATION ====================
  
  // Sign up with email and password
  signUp: async (email, password, name) => {
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Update user profile with name
      await user.updateProfile({ displayName: name });
      
      // Create user document in Firestore
      await firebase.firestore().collection('users').doc(user.uid).set({
        name: name,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, user: { uid: user.uid, email: user.email, name: name } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      
      return { 
        success: true, 
        user: { 
          uid: user.uid, 
          email: user.email, 
          name: userData?.name || user.displayName || 'User' 
        } 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Sign in with Google
  signInWithGoogle: async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const userCredential = await firebase.auth().signInWithPopup(provider);
      const user = userCredential.user;
      
      // Check if user document exists, create if not
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
  
  // Get user's tasks
  getTasks: async (userId) => {
    try {
      const tasksRef = firebase.firestore().collection('users').doc(userId).collection('tasks');
      const snapshot = await tasksRef.orderBy('createdAt', 'desc').get();
      
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
        const taskRef = tasksRef.doc(id || firebase.firestore().collection('tasks').doc().id);
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
        const itemRef = trashRef.doc(id || firebase.firestore().collection('trash').doc().id);
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
