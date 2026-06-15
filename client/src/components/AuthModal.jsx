import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, MapPin, X, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../lib/analytics';
import { auth } from '../lib/firebaseClient';
import { safeFetch } from '../lib/api';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';

export default function AuthModal({ 
  isOpen: propIsOpen, 
  onClose: propOnClose, 
  initialTab: propInitialTab, 
  onAuthSuccess: propOnAuthSuccess 
}) {
  const context = useAuth();
  
  const isOpen = propIsOpen !== undefined ? propIsOpen : context.authModalOpen;
  const onClose = propOnClose !== undefined ? propOnClose : (() => { context.setAuthModalOpen(false); context.setAuthModalMessage(''); });
  const onAuthSuccess = propOnAuthSuccess !== undefined ? propOnAuthSuccess : context.loginSuccess;
  
  const targetTab = propInitialTab || context.authModalTab || 'login';
  const authModalMessage = context.authModalMessage;

  const [activeTab, setActiveTab] = useState(targetTab); // 'login' | 'signup' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('IN');
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(targetTab);
    }
  }, [isOpen, targetTab]);

  if (!isOpen) return null;

  // Sync session and fetch/create user in backend
  const handleFirebaseSync = async (firebaseUser, nameValue, countryValue) => {
    try {
      const syncRes = await safeFetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          name: nameValue || firebaseUser.displayName || firebaseUser.email.split('@')[0],
          country: countryValue || country || 'IN',
          emailVerified: firebaseUser.emailVerified
        })
      });

      const contentType = syncRes.headers.get("content-type");
      if (syncRes.ok && contentType && contentType.includes("application/json")) {
        const data = await syncRes.json();
        localStorage.setItem('token', data.token);
        onAuthSuccess(data.user);
        onClose();
      } else {
        const errorText = await syncRes.text().catch(() => '');
        console.error("Backend synchronization failed. Status:", syncRes.status, "Response:", errorText);
        
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (!isDev) {
          console.warn("Falling back to client-only session (backend API not reachable).");
          const fallbackUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: nameValue || firebaseUser.displayName || firebaseUser.email.split('@')[0],
            country: countryValue || country || 'IN',
            isPremium: false,
            emailVerified: firebaseUser.emailVerified
          };
          onAuthSuccess(fallbackUser, 'client_auth_only');
          onClose();
        } else {
          throw new Error('Login failed due to a server error. Please try again later.');
        }
      }
    } catch (err) {
      console.error("Firebase sync error", err);
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isDev) {
        console.warn("Catch-block fallback to client-only session in production.");
        const fallbackUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: nameValue || firebaseUser.displayName || firebaseUser.email.split('@')[0],
          country: countryValue || country || 'IN',
          isPremium: false,
          emailVerified: firebaseUser.emailVerified
        };
        onAuthSuccess(fallbackUser, 'client_auth_only');
        onClose();
      } else {
        throw new Error(err.message || 'Login failed due to a server error. Please try again later.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSuccessMsg('');

    if (activeTab !== 'forgot') {
      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters long.");
        return;
      }
      if (password.length > 64) {
        setAuthError("Password must be at most 64 characters long.");
        return;
      }
    }

    if (activeTab === 'signup' && !acceptedTerms) {
      setAuthError("You must accept the Terms & Conditions and Privacy Policy.");
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === 'signup') {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // 2. Try to send client verification email (non-blocking)
        try {
          await sendEmailVerification(firebaseUser);
        } catch (emailErr) {
          console.warn("Firebase email verification skipped/failed:", emailErr);
        }
        
        // 3. Pre-create local user profile on backend and log in immediately
        await handleFirebaseSync(firebaseUser, name, country);
        
        // Track signup event in GA4
        trackEvent('signup_completed', { method: 'email' });
      } else if (activeTab === 'login') {
        // 1. Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // 2. Synchronize with local backend DB and load session JWT (no verified checks)
        await handleFirebaseSync(firebaseUser, name, country);
        
        // Track login event in GA4
        trackEvent('login_success', { method: 'email' });
      } else if (activeTab === 'forgot') {
        // 1. Send password reset email
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('If this email is registered, a password reset link has been sent. Please check your inbox and spam folder.');
        setActiveTab('login');
      }
    } catch (err) {
      console.error("Auth error", err);
      let friendlyMessage = err.message || 'An unexpected authentication error occurred.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        friendlyMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'The email address is invalid.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'The password must be at least 6 characters long.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email address is already in use by another account.';
      }
      setAuthError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification email utility
  const handleResendVerification = async () => {
    setAuthError('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const res = await safeFetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend verification email.');
      }
      setSuccessMsg('Verification email sent again. Please check your inbox.');
    } catch (err) {
      console.error("Resend error", err);
      setAuthError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google SSO Handler
  const handleGoogleSignIn = async () => {
    setAuthError('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      // Google Auth provider is automatically verified, so sync session immediately
      await handleFirebaseSync(firebaseUser, firebaseUser.displayName, country);
      
      // Track Google login and signup/sync events in GA4
      trackEvent('login_success', { method: 'google' });
      trackEvent('signup_completed', { method: 'google' });
    } catch (err) {
      console.error("Auth error", err);
      setAuthError(err.code || err.message || 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTab = () => {
    setActiveTab(activeTab === 'login' ? 'signup' : 'login');
    setAuthError('');
    setSuccessMsg('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <button className="modal-close-btn" onClick={onClose} disabled={isLoading}>
          <X size={16} />
        </button>

        <h3 className="modal-title">
          {activeTab === 'login' ? 'Welcome Back' : activeTab === 'signup' ? 'Join TRAVNIFY' : 'Reset Password'}
        </h3>
        <p className="modal-subtitle" style={{ marginBottom: '1.2rem' }}>
          {activeTab === 'login' 
            ? 'Sign in to access your planned trips and premium features' 
            : activeTab === 'signup'
            ? 'Create a free account to plan and save your day-by-day travel schedules'
            : 'Enter your email address and we will send you a password reset link'
          }
        </p>

        {authModalMessage && (
          <div style={{ 
            background: '#EFF6FF', 
            border: '1px solid #BFDBFE', 
            color: '#1E40AF', 
            padding: '0.6rem 1rem', 
            borderRadius: '10px', 
            fontSize: '0.85rem', 
            marginBottom: '1rem', 
            fontWeight: '500', 
            textAlign: 'center' 
          }}>
            ℹ️ {authModalMessage}
          </div>
        )}

        {authError && (
          <div style={{ 
            background: '#FEF2F2', 
            border: '2px solid #EF4444', 
            color: '#B91C1C', 
            padding: '0.8rem 1rem', 
            borderRadius: '10px', 
            fontSize: '0.9rem', 
            marginBottom: '1rem', 
            fontWeight: '600', 
            textAlign: 'center',
            wordBreak: 'break-all',
            userSelect: 'all',
            cursor: 'pointer'
          }} title="Click to select and copy this error">
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8, marginBottom: '2px' }}>Authentication Error</div>
            <div style={{ fontFamily: 'monospace' }}>{authError}</div>
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', padding: '0.6rem 1rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '500', textAlign: 'center' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {activeTab === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                  disabled={isLoading}
                />
                <User size={16} className="text-light" style={{ position: 'absolute', left: '1rem', top: '12px' }} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ paddingLeft: '2.5rem' }}
                required
                disabled={isLoading}
              />
              <Mail size={16} className="text-light" style={{ position: 'absolute', left: '1rem', top: '12px' }} />
            </div>
          </div>

          {activeTab !== 'forgot' && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                  disabled={isLoading}
                  minLength={6}
                  maxLength={64}
                />
                <Lock size={16} className="text-light" style={{ position: 'absolute', left: '1rem', top: '12px' }} />
              </div>
              {activeTab === 'login' && (
                <div style={{ textAlign: 'right', marginTop: '0.4rem' }}>
                  <span 
                    onClick={() => { setActiveTab('forgot'); setAuthError(''); setSuccessMsg(''); }}
                    style={{ color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Forgot Password?
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'signup' && (
            <div className="form-group">
              <label className="form-label">Home Country</label>
              <div style={{ position: 'relative' }}>
                <select
                  className="form-input"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  disabled={isLoading}
                >
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                </select>
                <MapPin size={16} className="text-light" style={{ position: 'absolute', left: '1rem', top: '12px' }} />
              </div>
            </div>
          )}

          {activeTab === 'signup' && (
            <div className="form-group" style={{ marginTop: '0.8rem' }}>
              <label className="terms-checkbox" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#475569' }}>
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  style={{ marginTop: '0.2rem' }}
                />
                <span>
                  I agree to the{" "}
                  <Link to="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>
          )}

          <button 
            type="submit" 
            className={`btn btn-primary ${isLoading ? 'btn-disabled' : ''}`}
            style={{ width: '100%', marginTop: '0.5rem', height: '44px' }}
            disabled={isLoading}
          >
            {isLoading ? <RefreshCw size={16} className="animate-spin" /> : null}
            <span>
              {isLoading 
                ? 'Processing...' 
                : activeTab === 'login' 
                ? 'Sign In' 
                : activeTab === 'signup' 
                ? 'Create Account' 
                : 'Send Reset Link'}
            </span>
            {!isLoading && <ArrowRight size={14} />}
          </button>
        </form>

        {activeTab !== 'forgot' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.2rem 0 0.8rem 0', gap: '0.8rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }}></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="btn btn-outline-slate"
              style={{
                width: '100%',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                borderColor: '#E2E8F0',
                background: '#FFFFFF',
                color: '#071739',
                fontWeight: '600',
                borderRadius: '12px'
              }}
              disabled={isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </>
        )}

        <div className="modal-footer-toggle" style={{ marginTop: '1.2rem' }}>
          {activeTab === 'forgot' ? (
            <p>Remembered your password? <span onClick={() => { setActiveTab('login'); setAuthError(''); setSuccessMsg(''); }}>Sign In</span></p>
          ) : activeTab === 'login' ? (
            <p>Don't have an account yet? <span onClick={toggleTab}>Sign Up</span></p>
          ) : (
            <p>Already have a registered account? <span onClick={toggleTab}>Sign In</span></p>
          )}
        </div>
      </div>
    </div>
  );
}
