import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import MonitoringService from '../services/monitoringService.js';

/**
 * Revenue Analytics Rollup Job (Sprint 10)
 * Aggregates daily payment volumes and subscription metrics.
 */
export async function runRevenueAnalyticsJob() {
  const startTime = Date.now();
  try {
    MonitoringService.updateJobStatus('revenueAnalytics', 'RUNNING');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayRevenue, activeSubs] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'SUCCESS', createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Subscription.countDocuments({ status: 'ACTIVE' }),
    ]);

    const duration = Date.now() - startTime;
    MonitoringService.updateJobStatus('revenueAnalytics', 'SUCCESS', duration);

    return {
      success: true,
      todayRevenue: todayRevenue[0]?.total || 0,
      todayTransactions: todayRevenue[0]?.count || 0,
      activeSubscriptions: activeSubs,
      durationMs: duration,
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    MonitoringService.updateJobStatus('revenueAnalytics', 'FAILED', duration);
    MonitoringService.captureError(err, { category: 'BACKGROUND_JOB_FAILURE', job: 'revenueAnalytics' });
    throw err;
  }
}

export default runRevenueAnalyticsJob;
