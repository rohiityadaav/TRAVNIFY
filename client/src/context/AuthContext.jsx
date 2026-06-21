import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebaseClient';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { safeFetch } from '../lib/api';

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
      let token = localStorage.getItem('token');
      if (token === 'undefined' || token === 'null') {
        token = null;
        localStorage.removeItem('token');
      }
      
      if (firebaseUser && token) {
        try {
          const res = await safeFetch('/api/auth/me', {
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
            
            if (res.status === 401 || res.status === 403) {
              localStorage.removeItem('token');
              await signOut(auth);
              setUser(null);
              setIsAuthenticated(false);
            } else {
              // Server error (e.g. 503 / 502 bad gateway or database lock)
              // Set user to null but keep token so they can retry on reload
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        } catch (err) {
          console.error("Auth session verification failed:", err);
          const isAuthError = err.status === 401 || err.status === 403;
          
          if (isAuthError) {
            console.warn("Session expired or token invalid. Logging out.");
            localStorage.removeItem('token');
            await signOut(auth);
            setUser(null);
            setIsAuthenticated(false);
          } else {
            // Temporary network/connection error or server startup delay
            // Set user to null but keep token so they can retry on reload
            setUser(null);
            setIsAuthenticated(false);
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

  useEffect(() => {
    const handleUnauthorized = async () => {
      if (!localStorage.getItem('token')) return;

      console.warn("Session expired or token invalid. Logging out.");
      localStorage.removeItem('token');
      try {
        await signOut(auth);
      } catch (err) {
        console.error("SignOut error during unauthorized event:", err);
      }
      setUser(null);
      setIsAuthenticated(false);
      alert("Session expired, please log in again.");
    };

    window.addEventListener('travnify-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('travnify-unauthorized', handleUnauthorized);
  }, []);

  const loginSuccess = (userData, token) => {
    if (token && token !== 'undefined' && token !== 'null') {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
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
      try {
        await safeFetch('/api/auth/logout', { method: 'POST' });
      } catch (logoutErr) {
        console.warn("Backend logout failed or offline:", logoutErr);
      }
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
