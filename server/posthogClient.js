const { PostHog } = require('posthog-node');

let posthogClient = null;

if (process.env.POSTHOG_API_KEY) {
  posthogClient = new PostHog(process.env.POSTHOG_API_KEY, {
    host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 1000
  });
} else {
  console.warn('WARNING: POSTHOG_API_KEY environment variable is missing. PostHog backend analytics is disabled.');
}

module.exports = posthogClient;
