import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

export default function ProtectedRoute({ children, fallbackTab = 'home', setActiveTab, message }) {
  const { isAuthenticated, loading, openAuthModalWithMessage } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Trigger sign-up modal with tailored protection text
      openAuthModalWithMessage('signup', message || 'Create a free TRAVNIFY account to access premium features.');
      
      // Gracefully route them back to the landing tab
      if (setActiveTab) {
        setActiveTab(fallbackTab);
      }
    }
  }, [loading, isAuthenticated, fallbackTab, setActiveTab, openAuthModalWithMessage, message]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--primary)' }} />
        <p style={{ color: '#64748B', fontWeight: '500', fontSize: '0.95rem' }}>Verifying your travel credentials...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return children;
  }

  // Prevent UI flash/flicker while modal triggers and tab reverts to landing
  return null;
}
