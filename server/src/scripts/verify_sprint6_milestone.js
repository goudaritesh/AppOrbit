import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const BASE_URL = process.env.SERVER_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/v1`;

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
};

const get = async (endpoint) => {
  const url = `${API_URL}${endpoint}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
};

const post = async (endpoint, body = {}) => {
  const url = `${API_URL}${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
};

async function runSprint6MilestoneTests() {
  console.log('===============================================================');
  console.log('🚀 APPORBIT SPRINT 6: PUBLIC MARKETPLACE & USER EXPERIENCE E2E');
  console.log('===============================================================\n');

  try {
    // -------------------------------------------------------------------------
    // 1. PUBLIC APP MARKETPLACE BROWSING & PAGINATION
    // -------------------------------------------------------------------------
    console.log('[1/8] Testing Public Application Marketplace & Pagination...');
    const appsRes = await get('/apps?page=1&limit=10');
    assert(appsRes.status === 200, 'GET /api/v1/apps returns 200 OK');
    assert(appsRes.data.success === true, 'Response indicates success');
    assert(Array.isArray(appsRes.data.data.apps), 'apps list is returned');
    assert(appsRes.data.data.pagination, 'pagination metadata is present');
    assert(appsRes.data.data.pagination.page === 1, 'page is 1');
    assert(appsRes.data.data.pagination.limit === 10, 'limit is 10');
    console.log(`  Found ${appsRes.data.data.apps.length} published apps on page 1 (total: ${appsRes.data.data.pagination.total})`);

    const sampleApp = appsRes.data.data.apps[0];
    if (sampleApp) {
      assert(sampleApp.id && sampleApp.name && sampleApp.slug, 'Sample app has id, name, and slug');
      assert(sampleApp.shortDescription, 'Sample app has shortDescription');
      assert(sampleApp.category, 'Sample app has category');
      assert(sampleApp.developer, 'Sample app has developer');
      assert(typeof sampleApp.downloadCount === 'number', 'Sample app has numeric downloadCount');
      assert(typeof sampleApp.ratingAverage === 'number', 'Sample app has numeric ratingAverage');
    }

    // -------------------------------------------------------------------------
    // 2. DISCOVERY FEEDS: FEATURED, POPULAR & LATEST
    // -------------------------------------------------------------------------
    console.log('\n[2/8] Testing Discovery Feeds (Featured, Popular, Latest)...');
    const featuredRes = await get('/apps/featured?limit=4');
    assert(featuredRes.status === 200, 'GET /api/v1/apps/featured returns 200 OK');
    assert(Array.isArray(featuredRes.data.data.apps), 'Featured apps array returned');

    const popularRes = await get('/apps/popular?limit=4');
    assert(popularRes.status === 200, 'GET /api/v1/apps/popular returns 200 OK');
    assert(Array.isArray(popularRes.data.data.apps), 'Popular apps array returned');

    const latestRes = await get('/apps/latest?limit=4');
    assert(latestRes.status === 200, 'GET /api/v1/apps/latest returns 200 OK');
    assert(Array.isArray(latestRes.data.data.apps), 'Latest apps array returned');

    // -------------------------------------------------------------------------
    // 3. SEARCH SYSTEM (Sprint 6 Endpoint: GET /api/v1/apps/search?q=...)
    // -------------------------------------------------------------------------
    console.log('\n[3/8] Testing Search System (GET /api/v1/apps/search?q=...)...');
    const searchQuery = sampleApp ? sampleApp.name.split(' ')[0] : 'Pulse';
    const searchRes = await get(`/apps/search?q=${encodeURIComponent(searchQuery)}`);
    assert(searchRes.status === 200, 'GET /api/v1/apps/search returns 200 OK');
    assert(searchRes.data.success === true, 'Search response indicates success');
    assert(Array.isArray(searchRes.data.results), 'search response contains "results" array matching Sprint 6 spec');
    console.log(`  Search query "${searchQuery}" returned ${searchRes.data.results.length} results`);

    // -------------------------------------------------------------------------
    // 4. CATEGORIES CATALOG & CATEGORY APPS
    // -------------------------------------------------------------------------
    console.log('\n[4/8] Testing Categories System (Catalog & Category Detail)...');
    const categoriesRes = await get('/categories');
    assert(categoriesRes.status === 200, 'GET /api/v1/categories returns 200 OK');
    assert(Array.isArray(categoriesRes.data.data.categories), 'Categories array returned');
    assert(categoriesRes.data.data.categories.length > 0, 'Categories catalog is non-empty');

    const sampleCat = categoriesRes.data.data.categories[0];
    assert(sampleCat.slug && sampleCat.name, 'Category has slug and name');
    console.log(`  Testing category: ${sampleCat.name} (${sampleCat.slug}) with ${sampleCat.appCount} apps`);

    // Test GET /api/v1/categories/:slug
    const catDetailRes = await get(`/categories/${sampleCat.slug}`);
    assert(catDetailRes.status === 200, `GET /api/v1/categories/${sampleCat.slug} returns 200 OK`);
    assert(catDetailRes.data.data.category.slug === sampleCat.slug, 'Returned category matches requested slug');
    assert(Array.isArray(catDetailRes.data.data.apps), 'Category apps array returned');

    // Test GET /api/v1/categories/:slug/apps
    const catAppsRes = await get(`/categories/${sampleCat.slug}/apps`);
    assert(catAppsRes.status === 200, `GET /api/v1/categories/${sampleCat.slug}/apps returns 200 OK`);

    // -------------------------------------------------------------------------
    // 5. APPLICATION DETAILS PAGE (GET /api/v1/apps/:slug)
    // -------------------------------------------------------------------------
    console.log('\n[5/8] Testing Application Details Page (GET /api/v1/apps/:slug)...');
    if (!sampleApp) {
      throw new Error('No published application available for detail testing');
    }
    const detailRes = await get(`/apps/${sampleApp.slug}`);
    assert(detailRes.status === 200, `GET /api/v1/apps/${sampleApp.slug} returns 200 OK`);
    const appDetail = detailRes.data.data.app;
    assert(appDetail.slug === sampleApp.slug, 'App details slug matches');
    assert(appDetail.developer, 'App developer information is populated');
    assert(Array.isArray(appDetail.screenshots), 'Screenshots array is present');
    assert(Array.isArray(appDetail.features), 'Features array is present');
    assert(Array.isArray(appDetail.technologies), 'Technologies array is present');
    assert(appDetail.currentVersion, 'currentVersion metadata is populated');
    console.log(`  Version: ${appDetail.currentVersion?.version}, SHA-256: ${appDetail.currentVersion?.sha256 ? 'Available (' + appDetail.currentVersion.sha256.substring(0, 16) + '...)' : 'None'}, Size: ${appDetail.currentVersion?.fileSize}`);

    // Test public security status endpoint
    const securityRes = await get(`/apps/${sampleApp.id}/security`);
    assert(securityRes.status === 200, `GET /api/v1/apps/${sampleApp.id}/security returns 200 OK`);
    assert(securityRes.data.success === true, 'Security status response indicates success');

    // -------------------------------------------------------------------------
    // 6. SECURE DOWNLOAD AUTHORIZATION & DOWNLOAD TRACKING
    // -------------------------------------------------------------------------
    console.log('\n[6/8] Testing Secure Capability Token Download Flow & Tracking...');
    const initialDownloadCount = appDetail.downloadCount;
    const downloadRes = await post(`/apps/${sampleApp.id}/download`);
    assert(downloadRes.status === 200, 'POST /api/v1/apps/:id/download returns 200 OK');
    assert(downloadRes.data.success === true, 'Download authorization success');
    assert(downloadRes.data.sessionToken, 'Short-lived session capability token issued');
    assert(downloadRes.data.downloadUrl, 'Capability download URL generated');
    assert(downloadRes.data.expiresIn > 0, 'Token expiration defined');
    console.log(`  Received capability token: ${downloadRes.data.sessionToken.substring(0, 16)}... URL: ${downloadRes.data.downloadUrl}`);

    // Verify that downloadCount incremented
    const refreshedAppRes = await get(`/apps/${sampleApp.slug}`);
    const updatedDownloadCount = refreshedAppRes.data.data.app.downloadCount;
    assert(updatedDownloadCount >= initialDownloadCount + 1, `Download count incremented from ${initialDownloadCount} to ${updatedDownloadCount}`);

    // -------------------------------------------------------------------------
    // 7. DEVELOPER PUBLIC PROFILE & TRUST BADGES
    // -------------------------------------------------------------------------
    console.log('\n[7/8] Testing Developer Public Profile (GET /api/v1/developers/:username)...');
    const devIdentifier = sampleApp.developer?.username || sampleApp.developer?.id;
    const devRes = await get(`/developers/${devIdentifier}`);
    assert(devRes.status === 200, `GET /api/v1/developers/${devIdentifier} returns 200 OK`);
    const dev = devRes.data.data.developer;
    assert(dev.name, 'Developer name is present');
    assert(dev.username, 'Developer username is present');
    assert(dev.verificationStatus, 'Developer verificationStatus is present');
    assert(dev.verificationLevel, 'Developer verificationLevel is present');
    assert(typeof dev.emailVerified === 'boolean', 'Developer emailVerified flag is present');
    assert(typeof dev.publishedAppsCount === 'number', 'Developer publishedAppsCount is present');
    assert(Array.isArray(dev.apps), 'Developer published apps array is returned');
    console.log(`  Developer: ${dev.name} (@${dev.username}), Level: ${dev.verificationLevel}, Published Apps: ${dev.publishedAppsCount}`);

    // -------------------------------------------------------------------------
    // 8. STRICT PUBLIC VISIBILITY ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n[8/8] Testing Strict Public Visibility Enforcement (Non-published apps isolation)...');
    // Verify that all returned apps in marketplace query have status === PUBLISHED
    const allMarketplaceAppsRes = await get('/apps?limit=50');
    const returnedApps = allMarketplaceAppsRes.data.data.apps;
    for (const app of returnedApps) {
      if (app.status) {
        assert(app.status === 'PUBLISHED', `App ${app.slug} must be PUBLISHED, but found: ${app.status}`);
      }
    }

    // Try requesting a non-existent or unapproved slug
    const fakeRes = await get('/apps/non-existent-or-draft-slug-12345');
    assert(fakeRes.status === 404, 'Unpublished or invalid app returns 404 Not Found as expected');

    console.log('\n===============================================================');
    console.log('🎉 SPRINT 6 MILESTONE FULLY VERIFIED — 100% PASS RATE');
    console.log('===============================================================\n');
  } catch (error) {
    console.error('\n❌ SPRINT 6 VERIFICATION FAILED:', error.message);
    process.exit(1);
  }
}

runSprint6MilestoneTests();
