import mongoose from 'mongoose';

/**
 * Application Analytics Daily Rollup Model (Phase 9)
 * Stores pre-aggregated daily performance stats so developer and admin dashboards
 * load in milliseconds without expensive raw event table scans.
 */
const applicationAnalyticsDailySchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      required: true,
      index: true,
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    sources: {
      direct: { type: Number, default: 0 },
      search: { type: Number, default: 0 },
      category: { type: Number, default: 0 },
      popular: { type: Number, default: 0 },
      trending: { type: Number, default: 0 },
      external: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

applicationAnalyticsDailySchema.index({ application: 1, date: 1 }, { unique: true });
applicationAnalyticsDailySchema.index({ developer: 1, date: 1 });

export const ApplicationAnalyticsDaily = mongoose.model(
  'ApplicationAnalyticsDaily',
  applicationAnalyticsDailySchema
);
export default ApplicationAnalyticsDaily;
