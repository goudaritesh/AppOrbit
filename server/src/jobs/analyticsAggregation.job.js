import AnalyticsEvent from '../models/AnalyticsEvent.js';
import ApplicationAnalyticsDaily from '../models/ApplicationAnalyticsDaily.js';
import App from '../models/App.js';

/**
 * Analytics Daily Aggregation Job (Phase 9)
 * Compiles raw analytics events into daily summary records.
 */
export const runAnalyticsAggregationJob = async () => {
  console.log('[Job:AnalyticsAggregation] Starting daily analytics aggregation...');
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const startOfDay = new Date(dateStr);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    // Group raw events by application
    const aggregates = await AnalyticsEvent.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          application: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            app: '$application',
            type: '$eventType',
          },
          count: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' },
        },
      },
    ]);

    const appMap = {};
    for (const item of aggregates) {
      const appId = item._id.app.toString();
      if (!appMap[appId]) {
        appMap[appId] = { views: 0, uniqueViews: 0, downloads: 0, reviews: 0 };
      }
      if (item._id.type === 'APP_VIEW') {
        appMap[appId].views = item.count;
        appMap[appId].uniqueViews = item.uniqueVisitors.filter(Boolean).length;
      } else if (item._id.type.includes('DOWNLOAD')) {
        appMap[appId].downloads += item.count;
      } else if (item._id.type === 'REVIEW_CREATED') {
        appMap[appId].reviews += item.count;
      }
    }

    let upsertedCount = 0;
    for (const [appId, data] of Object.entries(appMap)) {
      const app = await App.findById(appId).select('developer ratingAverage');
      if (app) {
        await ApplicationAnalyticsDaily.findOneAndUpdate(
          { application: appId, date: dateStr },
          {
            developer: app.developer,
            views: data.views,
            uniqueViews: data.uniqueViews,
            downloads: data.downloads,
            reviews: data.reviews,
            ratingAverage: app.ratingAverage,
          },
          { upsert: true, new: true }
        );
        upsertedCount++;
      }
    }

    console.log(`[Job:AnalyticsAggregation] Completed. Aggregated daily stats for ${upsertedCount} apps.`);
    return { success: true, count: upsertedCount };
  } catch (error) {
    console.error('[Job:AnalyticsAggregation] Failed:', error.message);
    return { success: false, error: error.message };
  }
};

export default runAnalyticsAggregationJob;
