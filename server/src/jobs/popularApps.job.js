import SearchService from '../modules/search/search.service.js';

/**
 * Popular Applications Job (Phase 9)
 * Pre-computes popular applications feed.
 */
export const runPopularAppsJob = async () => {
  console.log('[Job:PopularApps] Updating popular applications list...');
  try {
    const popular = await SearchService.getPopularApps({ limit: 12 });
    console.log(`[Job:PopularApps] Completed. Found ${popular.length} popular applications.`);
    return { success: true, count: popular.length };
  } catch (error) {
    console.error('[Job:PopularApps] Failed:', error.message);
    return { success: false, error: error.message };
  }
};

export default runPopularAppsJob;
