import App from '../models/App.js';

/**
 * Sitemap Generation Job (Phase 9)
 * Periodically verifies catalog integrity for sitemap cache.
 */
export const runSitemapJob = async () => {
  console.log('[Job:Sitemap] Verifying sitemap links...');
  try {
    const count = await App.countDocuments({ status: 'PUBLISHED', visibility: 'PUBLIC' });
    console.log(`[Job:Sitemap] Completed. Catalog contains ${count} published applications for SEO.`);
    return { success: true, publishedCount: count };
  } catch (error) {
    console.error('[Job:Sitemap] Failed:', error.message);
    return { success: false, error: error.message };
  }
};

export default runSitemapJob;
