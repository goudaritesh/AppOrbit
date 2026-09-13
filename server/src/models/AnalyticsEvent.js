import mongoose from 'mongoose';

/**
 * Analytics Event Model (Sprint 10 Centralized Event Tracking)
 * Captures core user and administrative lifecycle events safely and performantly.
 */
const analyticsEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: {
        values: [
          // Views & Downloads
          'APP_VIEW',
          'APP_VIEWED',
          'DOWNLOAD_REQUESTED',
          'DOWNLOAD_STARTED',
          'DOWNLOAD_COMPLETED',
          'APP_DOWNLOADED',
          // Discovery & Interactions
          'SEARCH',
          'SEARCH_PERFORMED',
          'GITHUB_CLICK',
          'DEMO_CLICK',
          'SHARE_CLICK',
          'APP_SHARED',
          // Reviews & Moderation
          'REVIEW_CREATED',
          'APP_PUBLISHED',
          'APP_APPROVED',
          // Monetization & Support
          'PAYMENT_SUCCESS',
          'SUBSCRIPTION_CREATED',
          'SUPPORT_TICKET_CREATED',
        ],
        message: '{VALUE} is not a valid analytics event type',
      },
      required: true,
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      default: null,
      index: true,
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    visitorId: {
      type: String,
      default: '',
      index: true,
    },
    source: {
      type: String,
      enum: [
        'DIRECT',
        'SEARCH',
        'CATEGORY',
        'POPULAR',
        'TRENDING',
        'RECOMMENDED',
        'EXTERNAL',
        'MARKETPLACE',
        'SHARE_BUTTON',
        'WEB',
        'API',
      ],
      default: 'DIRECT',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field compatibility aliases
analyticsEventSchema.virtual('appId')
  .get(function () { return this.application; })
  .set(function (val) { this.application = val; });

analyticsEventSchema.virtual('userId')
  .get(function () { return this.user; })
  .set(function (val) { this.user = val; });

// Indexes for high-throughput reporting queries
analyticsEventSchema.index({ application: 1, createdAt: -1 });
analyticsEventSchema.index({ developer: 1, createdAt: -1 });
analyticsEventSchema.index({ eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ application: 1, eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ user: 1, eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ application: 1, visitorId: 1, createdAt: -1 });

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
export default AnalyticsEvent;
