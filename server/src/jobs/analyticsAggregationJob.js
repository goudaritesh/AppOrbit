import mongoose from 'mongoose';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import DailyAnalytics from '../models/DailyAnalytics.js';
import App from '../models/App.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import MonitoringService from '../services/monitoringService.js';

/**
 * Daily Analytics Aggregation Job (Sprint 10)
 * Aggregates raw events into DailyAnalytics rollups for instant dashboard queries.
 */
export async function runDailyAnalyticsAggregation(targetDateStr = null) {
  const startTime = Date.now();
  try {
    MonitoringService.updateJobStatus('dailyAnalytics', 'RUNNING');

    // Default target date: today (YYYY-MM-DD)
    const targetDate = targetDateStr || new Date().toISOString().split('T')[0];
    const dayStart = new Date(`${targetDate}T00:00:00.000Z`);
    const dayEnd = new Date(`${targetDate}T23:59:59.999Z`);

    // 1. Fetch distinct applications with events on this date
    const appIds = await AnalyticsEvent.distinct('application', {
      createdAt: { $gte: dayStart, $lte: dayEnd },
      application: { $ne: null },
    });

    let processedCount = 0;

    for (const appId of appIds) {
      const app = await App.findById(appId).select('developer ratingAverage').lean();
      if (!app) continue;

      // Aggregate events for this app on target date
      const eventCounts = await AnalyticsEvent.aggregate([
        {
          $match: {
            application: new mongoose.Types.ObjectId(appId),
            createdAt: { $gte: dayStart, $lte: dayEnd },
          },
        },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
          },
        },
      ]);

      let views = 0;
      let downloads = 0;

      eventCounts.forEach((ec) => {
        if (['APP_VIEW', 'APP_VIEWED'].includes(ec._id)) {
          views += ec.count;
        } else if (['DOWNLOAD_COMPLETED', 'APP_DOWNLOADED', 'DOWNLOAD_STARTED'].includes(ec._id)) {
          downloads += ec.count;
        }
      });

      // Count reviews on this date
      const reviewsCount = await Review.countDocuments({
        application: appId,
        createdAt: { $gte: dayStart, $lte: dayEnd },
      });

      // Aggregate sources for this app
      const sourcesResult = await AnalyticsEvent.aggregate([
        {
          $match: {
            application: new mongoose.Types.ObjectId(appId),
            createdAt: { $gte: dayStart, $lte: dayEnd },
          },
        },
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
          },
        },
      ]);

      const sources = {
        direct: 0,
        search: 0,
        category: 0,
        popular: 0,
        trending: 0,
        external: 0,
      };

      sourcesResult.forEach((s) => {
        const key = (s._id || 'direct').toLowerCase();
        if (sources[key] !== undefined) {
          sources[key] = s.count;
        } else {
          sources.external += s.count;
        }
      });

      // Upsert into DailyAnalytics
      await DailyAnalytics.findOneAndUpdate(
        { application: appId, date: targetDate },
        {
          $set: {
            application: appId,
            developer: app.developer,
            date: targetDate,
            views,
            downloads,
            reviews: reviewsCount,
            ratingAverage: app.ratingAverage || 0,
            sources,
          },
        },
        { upsert: true, new: true }
      );

      processedCount++;
    }

    const duration = Date.now() - startTime;
    MonitoringService.updateJobStatus('dailyAnalytics', 'SUCCESS', duration);

    return {
      success: true,
      targetDate,
      appsProcessed: processedCount,
      durationMs: duration,
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    MonitoringService.updateJobStatus('dailyAnalytics', 'FAILED', duration);
    MonitoringService.captureError(err, { category: 'BACKGROUND_JOB_FAILURE', job: 'dailyAnalytics' });
    throw err;
  }
}

export default runDailyAnalyticsAggregation;
