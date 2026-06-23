import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import * as Sentry from '@sentry/react'
import posthog from 'posthog-js'
import { PostHogProvider } from '@posthog/react'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
  });
} else {
  console.warn('Sentry warning: VITE_SENTRY_DSN is missing. Sentry error monitoring is disabled.');
}

if (import.meta.env.VITE_POSTHOG_TOKEN) {
  posthog.init(import.meta.env.VITE_POSTHOG_TOKEN, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: true,
    autocapture: true,
    person_profiles: 'identified_only'
  });
} else {
  console.warn('PostHog warning: VITE_POSTHOG_TOKEN is missing. PostHog product analytics is disabled.');
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={({ error, resetError }) => (
      <div style={{
        padding: '3rem 1.5rem',
        background: '#071739',
        minHeight: '100vh',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🧭</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>Something went wrong</h1>
        <p style={{ color: '#94A3B8', maxWidth: '450px', marginBottom: '2rem', lineHeight: '1.6' }}>
          An unexpected error occurred while planning your journey. Sentry has been notified.
        </p>
        <button
          onClick={resetError}
          style={{
            background: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)',
            border: 'none',
            color: '#FFFFFF',
            padding: '0.8rem 2rem',
            borderRadius: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
          }}
        >
          Try Again
        </button>
      </div>
    )}>
      <PostHogProvider client={posthog}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </PostHogProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
