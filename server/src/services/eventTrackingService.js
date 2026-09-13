import AnalyticsEvent from '../models/AnalyticsEvent.js';
import App from '../models/App.js';

// In-memory rate limiting / debounce cache to prevent event flood
const recentEventsCache = new Map();
const DEBOUNCE_WINDOW_MS = 3000; // 3 seconds window for view duplicate suppress

// Periodic cache cleanup every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentEventsCache.entries()) {
    if (now - timestamp > DEBOUNCE_WINDOW_MS * 4) {
      recentEventsCache.delete(key);
    }
  }
}, 60000);

export class EventTrackingService {
  /**
   * Event Type Constants matching Sprint 10 specification
   */
  static EVENT_TYPES = {
    APP_VIEWED: 'APP_VIEWED',
    APP_DOWNLOADED: 'APP_DOWNLOADED',
    SEARCH_PERFORMED: 'SEARCH_PERFORMED',
    APP_SHARED: 'APP_SHARED',
    REVIEW_CREATED: 'REVIEW_CREATED',
    APP_PUBLISHED: 'APP_PUBLISHED',
    APP_APPROVED: 'APP_APPROVED',
    PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
    SUBSCRIPTION_CREATED: 'SUBSCRIPTION_CREATED',
    SUPPORT_TICKET_CREATED: 'SUPPORT_TICKET_CREATED',
  };

  /**
   * Tracks an event into the central analytics repository safely and asynchronously.
   *
   * @param {string} eventType - The action code
   * @param {Object} options
   * @param {string|ObjectId} [options.appId]
   * @param {string|ObjectId} [options.userId]
   * @param {string|ObjectId} [options.developerId]
   * @param {string} [options.visitorId]
   * @param {string} [options.source]
   * @param {Object} [options.metadata]
   * @param {boolean} [options.skipDebounce=false]
   */
  static async track(
    eventType,
    {
      appId = null,
      userId = null,
      developerId = null,
      visitorId = '',
      source = 'DIRECT',
      metadata = {},
      skipDebounce = false,
    } = {}
  ) {
    try {
      // 1. Debounce rapid identical events (e.g. repeated page refreshes within 3s)
      const dedupeKey = `${eventType}:${appId || 'none'}:${userId || visitorId || 'anon'}`;
      if (!skipDebounce && ['APP_VIEWED', 'APP_VIEW'].includes(eventType)) {
        const lastSeen = recentEventsCache.get(dedupeKey);
        if (lastSeen && Date.now() - lastSeen < DEBOUNCE_WINDOW_MS) {
          return null; // Suppress duplicate view within debounce window
        }
        recentEventsCache.set(dedupeKey, Date.now());
      }

      // 2. Resolve developer ID if not passed
      let resolvedDeveloperId = developerId;
      if (appId && !resolvedDeveloperId) {
        const foundApp = await App.findById(appId).select('developer').lean();
        if (foundApp) {
          resolvedDeveloperId = foundApp.developer;
        }
      }

      // 3. Persist event document
      const eventDoc = await AnalyticsEvent.create({
        eventType,
        application: appId,
        user: userId,
        developer: resolvedDeveloperId,
        visitorId: visitorId || 'anonymous',
        source,
        metadata,
      });

      // 4. Update aggregate counters on App model if applicable
      if (['APP_VIEWED', 'APP_VIEW'].includes(eventType) && appId) {
        await App.findByIdAndUpdate(appId, { $inc: { viewCount: 1 } });
      }

      return eventDoc;
    } catch (err) {
      // Non-blocking catch: event tracking failure should NEVER crash user requests
      console.error(`[EventTrackingService] Error capturing event "${eventType}":`, err.message);
      return null;
    }
  }

  /**
   * Helper for tracking app views
   */
  static async trackAppView(appId, { userId = null, visitorId = '', source = 'DIRECT', metadata = {} } = {}) {
    return this.track(this.EVENT_TYPES.APP_VIEWED, {
      appId,
      userId,
      visitorId,
      source,
      metadata,
    });
  }

  /**
   * Helper for tracking app downloads
   */
  static async trackAppDownload(appId, { userId = null, versionId = null, source = 'MARKETPLACE', metadata = {} } = {}) {
    return this.track(this.EVENT_TYPES.APP_DOWNLOADED, {
      appId,
      userId,
      source,
      metadata: { versionId, ...metadata },
      skipDebounce: true,
    });
  }

  /**
   * Helper for tracking search queries
   */
  static async trackSearch(query, { userId = null, resultsCount = 0, category = null, metadata = {} } = {}) {
    return this.track(this.EVENT_TYPES.SEARCH_PERFORMED, {
      userId,
      metadata: {
        query,
        resultsCount,
        category,
        isZeroResult: resultsCount === 0,
        ...metadata,
      },
      skipDebounce: true,
    });
  }

  /**
   * Helper for tracking reviews
   */
  static async trackReviewCreated(appId, reviewId, { userId = null, rating = 5 } = {}) {
    return this.track(this.EVENT_TYPES.REVIEW_CREATED, {
      appId,
      userId,
      metadata: { reviewId, rating },
      skipDebounce: true,
    });
  }

  /**
   * Helper for tracking payment success
   */
  static async trackPaymentSuccess(paymentId, { userId = null, planId = null, amount = 0, currency = 'INR' } = {}) {
    return this.track(this.EVENT_TYPES.PAYMENT_SUCCESS, {
      userId,
      metadata: { paymentId, planId, amount, currency },
      skipDebounce: true,
    });
  }

  /**
   * Helper for tracking subscriptions
   */
  static async trackSubscriptionCreated(subscriptionId, { userId = null, planTier = 'SILVER' } = {}) {
    return this.track(this.EVENT_TYPES.SUBSCRIPTION_CREATED, {
      userId,
      metadata: { subscriptionId, planTier },
      skipDebounce: true,
    });
  }
}

export default EventTrackingService;
