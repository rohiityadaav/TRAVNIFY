import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebaseClient';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [authModalMessage, setAuthModalMessage] = useState('');

  // Queue to retry actions that were locked behind login
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const token = localStorage.getItem('token');
      if (firebaseUser && token) {
        if (token === 'client_auth_only') {
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            country: 'IN',
            isPremium: false,
            emailVerified: firebaseUser.emailVerified
          });
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
        try {
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const contentType = res.headers.get("content-type");
          if (res.ok && contentType && contentType.includes("application/json")) {
            const userData = await res.json();
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            const resText = await res.text().catch(() => '');
            console.warn("Backend auth session check failed. Text:", resText);
            const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (!isDev) {
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                country: 'IN',
                isPremium: false,
                emailVerified: firebaseUser.emailVerified
              });
              setIsAuthenticated(true);
            } else {
              localStorage.removeItem('token');
              await signOut(auth);
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        } catch (err) {
          console.error("Auth session verification failed:", err);
          const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          if (!isDev) {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              country: 'IN',
              isPremium: false,
              emailVerified: firebaseUser.emailVerified
            });
            setIsAuthenticated(true);
          }
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginSuccess = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
    
    // Execute pending action if any
    if (pendingAction) {
      setTimeout(() => {
        try {
          pendingAction();
        } catch (err) {
          console.error("Pending action execution failed:", err);
        }
        setPendingAction(null);
      }, 100);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('token');
      await signOut(auth);
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openAuthModalWithMessage = (tab = 'login', message = '') => {
    setAuthModalTab(tab);
    setAuthModalMessage(message);
    setAuthModalOpen(true);
  };

  const executeProtectedAction = (actionCallback, message = 'Create a free TRAVNIFY account to start planning trips.') => {
    if (isAuthenticated) {
      actionCallback();
    } else {
      setPendingAction(() => actionCallback);
      openAuthModalWithMessage('signup', message);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      loading,
      isAuthenticated,
      loginSuccess,
      logout,
      authModalOpen,
      setAuthModalOpen,
      authModalTab,
      setAuthModalTab,
      authModalMessage,
      setAuthModalMessage,
      openAuthModalWithMessage,
      executeProtectedAction
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
