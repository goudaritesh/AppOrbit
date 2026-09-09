import SearchService from '../modules/search/search.service.js';

/**
 * Trending Applications Job (Phase 9)
 * Calculates top trending applications based on 7-day velocity.
 */
export const runTrendingAppsJob = async () => {
  console.log('[Job:TrendingApps] Recalculating 7-day trending applications...');
  try {
    const trending = await SearchService.getTrendingApps({ limit: 12 });
    console.log(`[Job:TrendingApps] Completed. Found ${trending.length} trending applications.`);
    return { success: true, count: trending.length };
  } catch (error) {
    console.error('[Job:TrendingApps] Failed:', error.message);
    return { success: false, error: error.message };
  }
};

export default runTrendingAppsJob;
