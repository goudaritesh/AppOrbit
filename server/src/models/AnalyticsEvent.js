import mongoose from 'mongoose';

/**
 * Analytics Event Model (Phase 9 Event-Based Analytics)
 * Captures user interactions without collecting unnecessary PII.
 */
const analyticsEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: {
        values: [
          'APP_VIEW',
          'DOWNLOAD_REQUESTED',
          'DOWNLOAD_STARTED',
          'DOWNLOAD_COMPLETED',
          'SEARCH',
          'REVIEW_CREATED',
          'GITHUB_CLICK',
          'DEMO_CLICK',
          'SHARE_CLICK',
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
      enum: ['DIRECT', 'SEARCH', 'CATEGORY', 'POPULAR', 'TRENDING', 'RECOMMENDED', 'EXTERNAL'],
      default: 'DIRECT',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

analyticsEventSchema.index({ application: 1, createdAt: -1 });
analyticsEventSchema.index({ developer: 1, createdAt: -1 });
analyticsEventSchema.index({ eventType: 1, createdAt: -1 });
analyticsEventSchema.index({ application: 1, visitorId: 1, createdAt: -1 });

export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
export default AnalyticsEvent;
