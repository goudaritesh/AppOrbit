/**
 * AppOrbit Frontend Environment Configuration (Phase 10)
 * Centralizes and validates frontend environment parameters.
 * Strictly guarantees that only safe public variables prefixed with VITE_ are consumed.
 */

export const env = {
  // API and Socket URLs
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  appUrl: import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'),
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',

  // Sentry
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',

  // Mode helpers
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
  mode: import.meta.env.MODE || 'development',

  // Firebase Web Push
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
  },
};

// Diagnostics on client boot in development
if (env.isDev && typeof console !== 'undefined') {
  console.log(`[AppOrbit Client] Booted in [${env.mode}] mode. Connecting to API: ${env.apiUrl}`);
}

export default env;
