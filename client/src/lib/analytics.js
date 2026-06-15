// TRAVNIFY Google Analytics 4 (GA4) Utility Module
// Recommended gtag.js implementation for SPAs

const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

/**
 * Initializes GA4 gtag.js script and configures the measurement stream.
 * Automatically no-ops if the env variable VITE_GA4_MEASUREMENT_ID is missing.
 */
export const initAnalytics = () => {
  if (!measurementId) {
    return;
  }

  // Prevent multiple script insertions
  if (window.dataLayer) {
    return;
  }

  // Asynchronously inject the Google Tag Manager script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize the global dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };

  // Configure standard parameters, disabling automated page_view to allow manual SPA tracking
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false
  });
};

/**
 * Manually tracks an SPA page view in GA4.
 * @param {string} path - The relative URL path (e.g. '/plan', '/explore')
 */
export const trackPageView = (path) => {
  if (!measurementId || !window.gtag) {
    return;
  }

  window.gtag('event', 'page_view', {
    page_path: path,
    send_to: measurementId
  });
};

/**
 * Sends a generic analytics event to GA4 with custom parameters.
 * @param {string} name - Event name (lowercase, separated by underscores)
 * @param {Object} params - Custom key-value pairs
 */
export const trackEvent = (name, params = {}) => {
  if (!measurementId || !window.gtag) {
    return;
  }

  window.gtag('event', name, params);
};
