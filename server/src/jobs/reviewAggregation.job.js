import App from '../models/App.js';
import ReviewService from '../modules/reviews/review.service.js';

/**
 * Review Aggregation Job (Phase 9)
 * Periodic audit that recalculates rating averages and distributions across all apps.
 */
export const runReviewAggregationJob = async () => {
  console.log('[Job:ReviewAggregation] Starting audit of application ratings...');
  try {
    const apps = await App.find({ status: 'PUBLISHED' }).select('_id name');
    let updatedCount = 0;

    for (const app of apps) {
      await ReviewService.recalculateAppRating(app._id);
      updatedCount++;
    }

    console.log(`[Job:ReviewAggregation] Completed. Recalculated ratings for ${updatedCount} applications.`);
    return { success: true, count: updatedCount };
  } catch (error) {
    console.error('[Job:ReviewAggregation] Failed:', error.message);
    return { success: false, error: error.message };
  }
};

export default runReviewAggregationJob;
