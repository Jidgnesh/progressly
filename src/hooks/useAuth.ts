import { useState, useEffect, useCallback } from 'react';
import type { AppUser, AuthResult } from '@/types';
import { STORAGE_KEY, AUTH_KEY, USERS_KEY } from '@/constants';
import { hashPassword, completeEmail } from '@/utils/auth';
import * as FirebaseService from '@/lib/firebase-service';
import { auth, db } from '@/lib/firebase';
import { getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthForm {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

interface ShowPassword {
  password: boolean;
  confirmPassword: boolean;
  newPassword: boolean;
  confirmNewPassword: boolean;
}

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

type AuthPage = 'signin' | 'signup' | 'forgot';
type ForgotStep = 'email' | 'reset';

const isFirebaseAvailable = (): boolean => {
  try {
    return !!auth && !!db;
  } catch {
    return false;
  }
};

export const useAuth = (showToast: (msg: string, type?: 'success' | 'error') => void) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [useFirebase, setUseFirebase] = useState(false);
  const [authPage, setAuthPage] = useState<AuthPage>('signin');
  const [authForm, setAuthForm] = useState<AuthForm>({ email: '', password: '', name: '', confirmPassword: '' });
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState<ShowPassword>({
    password: false,
    confirmPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPassword, setResetPassword] = useState<ResetPasswordForm>({ newPassword: '', confirmPassword: '' });
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const checkAuth = useCallback(async (): Promise<{ authenticated: boolean; user: AppUser | null; isFirebase: boolean }> => {
    if (isFirebaseAvailable()) {
      // Handle Google redirect result
      try {
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          const rUser = redirectResult.user;
          try {
            await FirebaseService.ensureOnline();
            const userRef = doc(db, 'users', rUser.uid);
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
              await setDoc(userRef, {
                name: rUser.displayName,
                email: rUser.email,
                picture: rUser.photoURL,
                provider: 'google',
                createdAt: serverTimestamp(),
              });
            }
          } catch (e) {
            console.warn('Could not create user doc after redirect:', (e as Error).message);
          }
        }
      } catch (redirectErr) {
        console.warn('getRedirectResult error:', (redirectErr as Error).message);
      }

      const user = FirebaseService.getCurrentUser();
      if (user) {
        let userName = user.displayName || 'User';
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          if (userData?.name) userName = userData.name as string;
        } catch (err) {
          console.warn('Could not fetch user document, using auth profile:', (err as Error).message);
        }
        const userInfo: AppUser = { uid: user.uid, email: user.email ?? '', name: userName };
        setCurrentUser(userInfo);
        setIsAuthenticated(true);
        setUseFirebase(true);
        return { authenticated: true, user: userInfo, isFirebase: true };
      }
    }

    // Fallback to localStorage
    const authData = localStorage.getItem(AUTH_KEY);
    if (authData) {
      setIsAuthenticated(true);
      setUseFirebase(false);
      return { authenticated: true, user: null, isFirebase: false };
    }
    return { authenticated: false, user: null, isFirebase: false };
  }, []);

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (authSubmitting) return;
    setAuthSubmitting(true);
    setAuthError('');
    const completedEmail = completeEmail(authForm.email);
    setAuthForm(prev => ({ ...prev, email: completedEmail }));

    if (!authForm.name || !completedEmail || !authForm.password) {
      setAuthError('All fields are required');
      setAuthSubmitting(false);
      return;
    }

    if (authForm.password !== authForm.confirmPassword) {
      setAuthError('Passwords do not match');
      setAuthSubmitting(false);
      return;
    }

    if (authForm.password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      setAuthSubmitting(false);
      return;
    }

    try {
      if (isFirebaseAvailable()) {
        const result: AuthResult = await FirebaseService.signUp(completedEmail, authForm.password, authForm.name);
        if (result.success && result.user) {
          setCurrentUser(result.user);
          setIsAuthenticated(true);
          setUseFirebase(true);
          setAuthForm({ email: '', password: '', name: '', confirmPassword: '' });

          // Migrate localStorage tasks to Firebase if any exist
          const localTasks = localStorage.getItem(STORAGE_KEY);
          if (localTasks) {
            const tasks = JSON.parse(localTasks);
            await FirebaseService.saveTasks(result.user.uid, tasks);
          }
          return;
        } else {
          setAuthError(result.error || 'Sign up failed');
          return;
        }
      }

      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      if (users.find((u: { email: string }) => u.email === completedEmail)) {
        setAuthError('Email already exists in local storage. Please use Firebase sign-up or use a different email.');
        return;
      }

      const hashedPw = await hashPassword(authForm.password);
      const newUser = {
        id: Date.now(),
        name: authForm.name,
        email: completedEmail,
        password: hashedPw,
        createdAt: Date.now(),
      };

      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      localStorage.setItem(AUTH_KEY, JSON.stringify({ email: completedEmail, name: authForm.name }));
      setIsAuthenticated(true);
      setUseFirebase(false);
      setAuthForm({ email: '', password: '', name: '', confirmPassword: '' });
    } finally {
      setAuthSubmitting(false);
    }
  }, [authForm, authSubmitting]);

  const handleSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (authSubmitting) return;
    setAuthSubmitting(true);
    setAuthError('');
    const completedEmailVal = completeEmail(authForm.email);
    setAuthForm(prev => ({ ...prev, email: completedEmailVal }));

    if (!completedEmailVal || !authForm.password) {
      setAuthError('Email and password are required');
      setAuthSubmitting(false);
      return;
    }

    try {
      if (isFirebaseAvailable()) {
        const result: AuthResult = await FirebaseService.signIn(completedEmailVal, authForm.password);
        if (result.success && result.user) {
          setCurrentUser(result.user);
          setIsAuthenticated(true);
          setUseFirebase(true);
          setAuthForm({ email: '', password: '', name: '', confirmPassword: '' });
          return;
        } else {
          setAuthError(result.error || 'Invalid email or password');
          return;
        }
      }

      // Fallback to localStorage
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const hashedPw = await hashPassword(authForm.password);
      const user = users.find((u: { email: string; password: string }) => u.email === completedEmailVal && u.password === hashedPw);

      if (!user) {
        setAuthError('Invalid email or password');
        return;
      }

      localStorage.setItem(AUTH_KEY, JSON.stringify({ email: user.email, name: user.name }));
      setIsAuthenticated(true);
      setUseFirebase(false);
      setAuthForm({ email: '', password: '', name: '', confirmPassword: '' });
    } finally {
      setAuthSubmitting(false);
    }
  }, [authForm, authSubmitting]);

  const handleGoogleSignIn = useCallback(async () => {
    setAuthError('');
    if (!isFirebaseAvailable()) {
      setAuthError('Google Sign-In requires Firebase. Please use email instead.');
      return;
    }
    const result: AuthResult = await FirebaseService.signInWithGoogle();
    if (result.success && result.redirect) {
      return;
    }
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      setUseFirebase(true);
      setAuthForm({ email: '', password: '', name: '', confirmPassword: '' });
    } else {
      let errorMessage = result.error || 'Google Sign-In failed';
      if (result.error?.includes('popup-closed-by-user')) {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (result.error?.includes('popup-blocked')) {
        errorMessage = 'Pop-up blocked by browser. Please allow pop-ups and try again.';
      }
      setAuthError(errorMessage);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (useFirebase && isFirebaseAvailable()) {
      await FirebaseService.signOut();
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    setUseFirebase(false);
    setAuthPage('signin');
  }, [useFirebase]);

  const handleForgotPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const completedForgotEmail = completeEmail(forgotEmail);
    setForgotEmail(completedForgotEmail);

    if (!completedForgotEmail) {
      setAuthError('Please enter your email address');
      return;
    }

    if (isFirebaseAvailable()) {
      const result = await FirebaseService.resetPassword(completedForgotEmail);
      if (result.success) {
        setAuthError('');
        setResetEmailSent(true);
        return;
      } else {
        let errorMessage = result.error || 'Failed to send reset email';
        if (result.error?.includes('user-not-found')) {
          errorMessage = 'No account found with this email address.';
        }
        setAuthError(errorMessage);
        return;
      }
    }

    // Fallback to localStorage
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: { email: string }) => u.email === completedForgotEmail);

    if (!user) {
      setAuthError('No account found with this email address');
      return;
    }

    setForgotStep('reset');
    setAuthError('');
  }, [forgotEmail]);

  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!resetPassword.newPassword || !resetPassword.confirmPassword) {
      setAuthError('Please fill in all fields');
      return;
    }

    if (resetPassword.newPassword.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    if (resetPassword.newPassword !== resetPassword.confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    // localStorage password reset
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex((u: { email: string }) => u.email === forgotEmail);

    if (userIndex === -1) {
      setAuthError('User not found');
      return;
    }

    users[userIndex].password = await hashPassword(resetPassword.newPassword);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    setAuthError('');
    setAuthPage('signin');
    setForgotEmail('');
    setResetPassword({ newPassword: '', confirmPassword: '' });
    setForgotStep('email');

    showToast('Password reset successfully! You can now sign in with your new password.');
  }, [resetPassword, forgotEmail, showToast]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    if (!isFirebaseAvailable()) return;

    const unsubscribe = FirebaseService.onAuthStateChanged((user) => {
      if (!user) {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setUseFirebase(false);
        setAuthPage('signin');
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    isAuthenticated,
    currentUser,
    useFirebase,
    authPage,
    setAuthPage,
    authForm,
    setAuthForm,
    authError,
    setAuthError,
    showPassword,
    setShowPassword,
    forgotEmail,
    setForgotEmail,
    resetPassword,
    setResetPassword,
    forgotStep,
    setForgotStep,
    resetEmailSent,
    setResetEmailSent,
    authSubmitting,
    checkAuth,
    handleSignUp,
    handleSignIn,
    handleGoogleSignIn,
    handleLogout,
    handleForgotPassword,
    handleResetPassword,
    completeEmail,
  };
};
