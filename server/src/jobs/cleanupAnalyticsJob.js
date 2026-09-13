import AnalyticsEvent from '../models/AnalyticsEvent.js';
import MonitoringService from '../services/monitoringService.js';

/**
 * Analytics Cleanup Job (Sprint 10)
 * Purges raw event telemetry older than retention window (default 90 days)
 * while preserving all pre-aggregated DailyAnalytics.
 */
export async function runCleanupAnalyticsJob(retentionDays = 90) {
  const startTime = Date.now();
  try {
    MonitoringService.updateJobStatus('cleanup', 'RUNNING');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deleteResult = await AnalyticsEvent.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    const duration = Date.now() - startTime;
    MonitoringService.updateJobStatus('cleanup', 'SUCCESS', duration);

    return {
      success: true,
      deletedCount: deleteResult.deletedCount,
      cutoffDate,
      durationMs: duration,
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    MonitoringService.updateJobStatus('cleanup', 'FAILED', duration);
    MonitoringService.captureError(err, { category: 'BACKGROUND_JOB_FAILURE', job: 'cleanup' });
    throw err;
  }
}

export default runCleanupAnalyticsJob;
