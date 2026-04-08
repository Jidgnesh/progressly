import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  enableNetwork,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AuthResult, Task, TrashTask } from '@/types';

// ==================== HELPERS ====================

/** Ensure Firestore is online before operations */
export const ensureOnline = async (): Promise<void> => {
  try {
    await enableNetwork(db);
  } catch (e) {
    console.warn('Could not enable network:', (e as Error).message);
  }
};

// ==================== AUTHENTICATION ====================

/** Sign up with email and password */
export const signUp = async (email: string, password: string, name: string): Promise<AuthResult> => {
  try {
    // Ensure Firestore is online (non-blocking)
    try {
      await enableNetwork(db);
    } catch (networkErr) {
      console.warn('enableNetwork failed, proceeding with signup:', (networkErr as Error).message);
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with name
    try {
      await updateProfile(user, { displayName: name });
    } catch (profileErr) {
      console.warn('Failed to update profile displayName:', (profileErr as Error).message);
    }

    // Create user document in Firestore
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        createdAt: serverTimestamp(),
      });
    } catch (firestoreError) {
      console.warn('Firestore document creation failed, will retry:', (firestoreError as Error).message);
      setTimeout(async () => {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            name,
            email,
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.error('Failed to create user document in background:', e);
        }
      }, 1000);
    }

    return { success: true, user: { uid: user.uid, email: user.email ?? email, name } };
  } catch (error) {
    const err = error as { code?: string; message: string };

    // If email is already in use, try signing them in automatically
    if (err.code === 'auth/email-already-in-use') {
      try {
        const signInResult = await signIn(email, password);
        if (signInResult.success) {
          // Update name if needed
          const currentUser = auth.currentUser;
          if (currentUser && !currentUser.displayName) {
            try {
              await updateProfile(currentUser, { displayName: name });
            } catch (_) {
              // ignore
            }
          }
          return signInResult;
        }
      } catch (_) {
        // Sign-in also failed
      }
      return { success: false, error: 'This email is already registered. Please sign in instead.' };
    }

    let errorMessage = err.message;
    if (err.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please use a stronger password.';
    } else if (err.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address. Please check and try again.';
    } else if (err.message && err.message.includes('offline')) {
      errorMessage = 'You appear to be offline. Please check your internet connection and try again.';
    }
    return { success: false, error: errorMessage };
  }
};

/** Sign in with email and password */
export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore (graceful fallback if offline)
    let userName = user.displayName || 'User';
    try {
      await ensureOnline();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      if (userData?.name) userName = userData.name as string;
    } catch (firestoreErr) {
      console.warn('Could not fetch user document during sign-in, using auth profile:', (firestoreErr as Error).message);
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email ?? email,
        name: userName,
      },
    };
  } catch (error) {
    const err = error as { code?: string; message: string };
    let errorMessage = err.message;
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      errorMessage = 'Incorrect password. Please try again.';
    } else if (err.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email. Please sign up first.';
    } else if (err.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address. Please check and try again.';
    } else if (err.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later.';
    } else if (err.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled. Please contact support.';
    }
    return { success: false, error: errorMessage };
  }
};

/** Sign in with Google */
export const signInWithGoogle = async (): Promise<AuthResult> => {
  try {
    const provider = new GoogleAuthProvider();

    // Try popup first, fall back to redirect if it fails
    let user: User;
    try {
      const userCredential = await signInWithPopup(auth, provider);
      user = userCredential.user;
    } catch (popupErr) {
      const err = popupErr as { code?: string; message: string };
      // Popup blocked, closed, or session storage issue -- use redirect
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.message.includes('sessionStorage') ||
        err.message.includes('initial state')
      ) {
        await signInWithRedirect(auth, provider);
        return { success: true, redirect: true };
      }
      throw popupErr;
    }

    // Create user document in Firestore (graceful if offline)
    try {
      await ensureOnline();
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          picture: user.photoURL,
          provider: 'google',
          createdAt: serverTimestamp(),
        });
      }
    } catch (firestoreErr) {
      console.warn('Could not access Firestore during Google sign-in, using auth profile:', (firestoreErr as Error).message);
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email ?? '',
        name: user.displayName ?? '',
        picture: user.photoURL ?? undefined,
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

/** Sign out */
export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

/** Get current user */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/** Listen to auth state changes */
export const onAuthStateChanged = (callback: (user: User | null) => void): Unsubscribe => {
  return firebaseOnAuthStateChanged(auth, callback);
};

/** Reset password */
export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

/** Update password */
export const updateUserPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user signed in' };
    }
    await firebaseUpdatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

// ==================== FIRESTORE (TASKS) ====================

/** Get user's tasks */
export const getTasks = async (userId: string): Promise<{ success: boolean; tasks: Task[]; error?: string }> => {
  try {
    await ensureOnline();
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const q = query(tasksRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    const tasks: Task[] = [];
    snapshot.forEach(docSnap => {
      tasks.push({ id: docSnap.id, ...docSnap.data() } as unknown as Task);
    });

    return { success: true, tasks };
  } catch (error) {
    return { success: false, error: (error as Error).message, tasks: [] };
  }
};

/** Save tasks */
export const saveTasks = async (userId: string, tasks: Task[]): Promise<{ success: boolean; error?: string }> => {
  try {
    await ensureOnline();
    const batch = writeBatch(db);
    const tasksRef = collection(db, 'users', userId, 'tasks');

    // Delete all existing tasks
    const snapshot = await getDocs(tasksRef);
    snapshot.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    // Add all new tasks
    tasks.forEach(task => {
      const { id, ...taskData } = task;
      const taskRef = doc(tasksRef, String(id) || doc(tasksRef).id);
      batch.set(taskRef, {
        ...taskData,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

/** Get user's trash */
export const getTrash = async (userId: string): Promise<{ success: boolean; trash: TrashTask[]; error?: string }> => {
  try {
    await ensureOnline();
    const trashRef = collection(db, 'users', userId, 'trash');
    const q = query(trashRef, orderBy('deletedAt', 'desc'));
    const snapshot = await getDocs(q);

    const trash: TrashTask[] = [];
    snapshot.forEach(docSnap => {
      trash.push({ id: docSnap.id, ...docSnap.data() } as unknown as TrashTask);
    });

    return { success: true, trash };
  } catch (error) {
    return { success: false, error: (error as Error).message, trash: [] };
  }
};

/** Save trash */
export const saveTrash = async (userId: string, trash: TrashTask[]): Promise<{ success: boolean; error?: string }> => {
  try {
    await ensureOnline();
    const batch = writeBatch(db);
    const trashRef = collection(db, 'users', userId, 'trash');

    // Delete all existing trash
    const snapshot = await getDocs(trashRef);
    snapshot.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    // Add all new trash items
    trash.forEach(item => {
      const { id, ...itemData } = item;
      const itemRef = doc(trashRef, String(id) || doc(trashRef).id);
      batch.set(itemRef, {
        ...itemData,
        deletedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

/** Real-time listener for tasks */
export const subscribeToTasks = (userId: string, callback: (tasks: Task[]) => void): Unsubscribe => {
  const tasksRef = collection(db, 'users', userId, 'tasks');

  return onSnapshot(
    tasksRef,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach(docSnap => {
        tasks.push({ id: docSnap.id, ...docSnap.data() } as unknown as Task);
      });
      callback(tasks);
    },
    (error) => {
      console.error('Error listening to tasks:', error);
      callback([]);
    },
  );
};
