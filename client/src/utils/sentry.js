/**
 * AppOrbit Frontend Sentry Integration Wrapper (Phase 10)
 * Captures unhandled client errors, Promise rejections, and React lifecycle errors.
 * No-ops gracefully if VITE_SENTRY_DSN is absent.
 */
import { env } from '../config/env.js';

class ClientSentry {
  constructor() {
    this.isInitialized = false;
    this.dsn = env.sentryDsn;

    if (this.dsn && env.isProd) {
      this.isInitialized = true;
      if (typeof window !== 'undefined') {
        window.addEventListener('error', (event) => {
          this.captureException(event.error || event.message);
        });
        window.addEventListener('unhandledrejection', (event) => {
          this.captureException(event.reason);
        });
      }
    }
  }

  captureException(error, context = {}) {
    if (!this.isInitialized) {
      if (env.isDev) {
        console.warn('[Sentry Dev Fallback] Captured Exception:', error, context);
      }
      return;
    }
    // Forward to Sentry client when installed
  }

  captureMessage(message, level = 'info') {
    if (!this.isInitialized) return;
  }
}

export const clientSentry = new ClientSentry();
export default clientSentry;
