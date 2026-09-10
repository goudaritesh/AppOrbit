import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  subscribeToAuthState,
} from '../services/firebaseAuthService';
import toast from 'react-hot-toast';

const FirebaseAuthContext = createContext(null);

export function FirebaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Listen for real-time Firebase Auth state changes
    const unsubscribe = subscribeToAuthState((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await loginWithEmail(email, password);
      setUser(result.user);
      toast.success(`Welcome back, ${result.user.name}!`);
      return result;
    } catch (err) {
      const msg = formatAuthErrorMessage(err.code) || err.message;
      setAuthError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (email, password, profileData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await registerWithEmail(email, password, profileData);
      setUser(result.user);
      toast.success('Account created successfully with Firebase!');
      return result;
    } catch (err) {
      const msg = formatAuthErrorMessage(err.code) || err.message;
      setAuthError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      toast.success('Signed out successfully.');
    } catch (err) {
      toast.error(err.message || 'Logout failed');
    }
  };

  const value = {
    user,
    loading,
    error: authError,
    isAuthenticated: !!user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}

function formatAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled yet in the Firebase Console.';
    default:
      return null;
  }
}

export default FirebaseAuthContext;
