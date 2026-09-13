import BetaAnalyticsService from '../services/betaAnalyticsService.js';
import logger from '../utils/logger.js';

/**
 * Scheduled Beta Metrics Snapshot Job (Sprint 12)
 * Periodically generates a health and acquisition snapshot of the beta program.
 */
export async function runBetaMetricsJob() {
  try {
    const analytics = await BetaAnalyticsService.getBetaAnalytics();
    logger.info('[BetaMetricsJob] Aggregated Beta Program Metrics', {
      version: analytics.version,
      betaUsers: analytics.overview.betaUsers,
      betaDevelopers: analytics.overview.betaDevelopers,
      publishedApps: analytics.overview.publishedApps,
      openBugs: analytics.overview.openBugs,
      criticalBugs: analytics.overview.criticalBugs,
      totalFeedback: analytics.overview.totalFeedback,
      averageRating: analytics.overview.averageRating,
    });
    return analytics;
  } catch (err) {
    logger.error('[BetaMetricsJob] Failed to aggregate beta metrics:', { error: err.message });
    throw err;
  }
}

export default {
  runBetaMetricsJob,
};
