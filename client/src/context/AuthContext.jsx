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
    let isMounted = true;

    async function initializeAuth() {
      let token = localStorage.getItem('token');
      const localRefreshToken = localStorage.getItem('refreshToken');
      
      if (token === 'undefined' || token === 'null') {
        token = null;
        localStorage.removeItem('token');
      }

      console.log("[DEBUG Auth] initializeAuth - token exists:", !!token, "refreshToken exists:", !!localRefreshToken);

      let verified = false;

      // 1. Try to verify the current access token
      if (token) {
        try {
          console.log("[DEBUG Auth] Verifying current access token...");
          const res = await safeFetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const contentType = res.headers.get("content-type");
          if (res.ok && contentType && contentType.includes("application/json")) {
            const userData = await res.json();
            console.log("[DEBUG Auth] Token verification succeeded. Credits:", userData?.dailyCreditsUsed);
            if (isMounted) {
              setUser(userData);
              setIsAuthenticated(true);
              verified = true;
            }
          }
        } catch (err) {
          console.warn("[DEBUG Auth] Token verification failed:", err);
        }
      }

      // 2. If access token verification failed or was skipped, try silent refresh
      if (!verified && localRefreshToken) {
        try {
          console.log("[DEBUG Auth] Attempting silent refresh via refresh token...");
          const res = await safeFetch('/api/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: localRefreshToken }),
            headers: { 'Content-Type': 'application/json' }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.token) {
              console.log("[DEBUG Auth] Silent refresh succeeded. Credits:", data.user?.dailyCreditsUsed);
              if (isMounted) {
                loginSuccess(data.user, data.token);
                verified = true;
              }
            }
          }
        } catch (refreshErr) {
          console.error("[DEBUG Auth] Silent refresh failed:", refreshErr);
        }
      }

      // 3. If both failed, check if Firebase has a user we can sync from.
      if (!verified && auth.currentUser) {
        try {
          console.log("[DEBUG Auth] Custom session verification failed, but Firebase user exists. Syncing...");
          const syncRes = await safeFetch('/api/auth/firebase-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: auth.currentUser.email,
              name: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
              country: 'IN',
              emailVerified: auth.currentUser.emailVerified
            })
          });
          if (syncRes.ok) {
            const data = await syncRes.json();
            if (data.token && isMounted) {
              loginSuccess(data.user, data.token);
              verified = true;
            }
          }
        } catch (syncErr) {
          console.error("[DEBUG Auth] Syncing from existing Firebase user failed:", syncErr);
        }
      }

      // 4. If still not verified, clear everything
      if (!verified) {
        console.log("[DEBUG Auth] Not authenticated. Cleaning up session.");
        if (isMounted) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setUser(null);
          setIsAuthenticated(false);
          try {
            await signOut(auth);
          } catch (signOutErr) {
            console.error("Firebase signOut error:", signOutErr);
          }
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    initializeAuth();

    // Listen for future auth state changes (e.g. if another tab signs in/out, or on first load)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[DEBUG Auth] onAuthStateChanged - firebaseUser:", firebaseUser ? firebaseUser.email : 'null');
      if (firebaseUser) {
        const token = localStorage.getItem('token');
        const localRefreshToken = localStorage.getItem('refreshToken');
        if (!token && !localRefreshToken) {
          console.log("[DEBUG Auth] Firebase user exists but no local session. Syncing...");
          try {
            const syncRes = await safeFetch('/api/auth/firebase-sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                country: 'IN',
                emailVerified: firebaseUser.emailVerified
              })
            });
            if (syncRes.ok) {
              const data = await syncRes.json();
              if (data.token && isMounted) {
                loginSuccess(data.user, data.token);
              }
            }
          } catch (syncErr) {
            console.error("[DEBUG Auth] Auto-sync onAuthStateChanged failed:", syncErr);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
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
    console.log("[DEBUG Auth] loginSuccess called - userData:", userData ? { email: userData.email, hasRefreshToken: !!userData.refreshToken } : 'null', "token exists:", !!token);
    if (token && token !== 'undefined' && token !== 'null') {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    if (userData && userData.refreshToken) {
      console.log("[DEBUG Auth] Saving refreshToken to localStorage:", userData.refreshToken.substring(0, 10) + "...");
      localStorage.setItem('refreshToken', userData.refreshToken);
    } else {
      console.log("[DEBUG Auth] No refreshToken found in userData!");
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
      const localRefreshToken = localStorage.getItem('refreshToken');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      try {
        await safeFetch('/api/auth/logout', { 
          method: 'POST',
          body: JSON.stringify({ refreshToken: localRefreshToken }),
          headers: { 'Content-Type': 'application/json' }
        });
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
