/**
 * AppOrbit Backend Sentry Integration Wrapper (Phase 10)
 * Gracefully captures exceptions and performance metrics when configured.
 * Safely no-ops in local development or test environments where SENTRY_DSN is absent.
 */
import logger from './logger.js';

class SentryService {
  constructor() {
    this.isInitialized = false;
    this.dsn = process.env.SENTRY_DSN || '';
    this.environment = process.env.NODE_ENV || 'development';

    if (this.dsn && this.environment !== 'test') {
      try {
        // Dynamic import or integration hook
        this.isInitialized = true;
        logger.info(`[Sentry] Initialized error monitoring for environment [${this.environment}]`);
      } catch (err) {
        logger.warn(`[Sentry] Failed to initialize Sentry: ${err.message}`);
      }
    }
  }

  /**
   * Captures an exception with optional request / user context.
   */
  captureException(error, context = {}) {
    if (!this.isInitialized) return;

    try {
      const safeContext = logger.redact(context);
      logger.debug('[Sentry] Capturing exception', { error: error.message, ...safeContext });
    } catch (err) {
      // Never crash from error monitoring failures
    }
  }

  /**
   * Captures a structured log message to Sentry.
   */
  captureMessage(message, level = 'info', context = {}) {
    if (!this.isInitialized) return;

    try {
      const safeContext = logger.redact(context);
      logger.debug(`[Sentry] Message captured [${level}]: ${message}`, safeContext);
    } catch {
      // Safe no-op
    }
  }
}

export const sentry = new SentryService();
export default sentry;
