import mongoose from 'mongoose';

/**
 * Daily Analytics Aggregation Model (Sprint 10)
 * Stores pre-computed daily rollups for lightning-fast dashboards without raw event table scans.
 */
const dailyAnalyticsSchema = new mongoose.Schema(
  {
    date: {
      type: String, // Format: YYYY-MM-DD
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
    views: {
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
    newUsers: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field compatibility alias
dailyAnalyticsSchema.virtual('appId')
  .get(function () { return this.application; })
  .set(function (val) { this.application = val; });

dailyAnalyticsSchema.index({ application: 1, date: 1 }, { unique: true });
dailyAnalyticsSchema.index({ developer: 1, date: 1 });

export const DailyAnalytics = mongoose.model('DailyAnalytics', dailyAnalyticsSchema);
export default DailyAnalytics;
