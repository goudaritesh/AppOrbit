import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import App from '../models/App.js';
import AppVersion from '../models/AppVersion.js';
import Review from '../models/Review.js';
import ReviewVote from '../models/ReviewVote.js';
import ReviewReport from '../models/ReviewReport.js';
import DownloadSession from '../models/DownloadSession.js';
import DownloadEvent from '../models/DownloadEvent.js';
import SearchHistory from '../models/SearchHistory.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import ApplicationAnalyticsDaily from '../models/ApplicationAnalyticsDaily.js';

// Background Jobs
import runReviewAggregationJob from '../jobs/reviewAggregation.job.js';
import runTrendingAppsJob from '../jobs/trendingApps.job.js';
import runPopularAppsJob from '../jobs/popularApps.job.js';
import runAnalyticsAggregationJob from '../jobs/analyticsAggregation.job.js';
import runSitemapJob from '../jobs/sitemapGeneration.job.js';

const API_URL = 'http://localhost:5000/api';
const ROOT_URL = 'http://localhost:5000';

async function runPhase9Tests() {
  console.log('===============================================================');
  console.log('   APPORBIT — PHASE 9 AUTOMATED E2E TEST & AUDIT SUITE         ');
  console.log('   Reviews, Ratings, Secure Downloads, Search, SEO & Analytics ');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await connectDB();

    // ==============================================================
    // 1. AUTHENTICATION SETUP
    // ==============================================================
    console.log('\n--- 1. Authenticating Roles ---');

    // 1.1 Developer Login
    const devLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dev.aura@apporbit.io', password: 'Password123!' }),
    });
    const devLogin = await devLoginRes.json();
    assert(devLogin.success && devLogin.data?.accessToken, 'Developer dev.aura authenticated');
    const devToken = devLogin.data.accessToken;
    const developerId = devLogin.data.user.id || devLogin.data.user._id;

    // 1.2 Admin Login
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@apporbit.io', password: 'AppOrbitAdmin2026!' }),
    });
    const adminLogin = await adminLoginRes.json();
    assert(adminLogin.success && adminLogin.data?.accessToken, 'Super Admin authenticated');
    const adminToken = adminLogin.data.accessToken;
    const adminId = adminLogin.data.user.id || adminLogin.data.user._id;

    // 1.3 Public User 1
    const user1LoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'public.testuser@apporbit.io', password: 'Password123!' }),
    });
    const user1Login = await user1LoginRes.json();
    assert(user1Login.success && user1Login.data?.accessToken, 'Public User 1 authenticated');
    const user1Token = user1Login.data.accessToken;
    const user1Id = user1Login.data.user.id || user1Login.data.user._id;

    // 1.4 Secondary Public User 2 (Ensure exists for multi-user tests)
    let user2 = await User.findOne({ email: 'user2.phase9@apporbit.io' });
    if (!user2) {
      user2 = await User.create({
        name: 'Alex Reviewer',
        username: 'alexreviewer',
        email: 'user2.phase9@apporbit.io',
        password: 'Password123!',
        role: 'USER',
        emailVerified: true,
        accountStatus: 'ACTIVE',
      });
    } else {
      user2.emailVerified = true;
      user2.accountStatus = 'ACTIVE';
      user2.password = 'Password123!';
      await user2.save();
    }

    const user2LoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user2.phase9@apporbit.io', password: 'Password123!' }),
    });
    const user2Login = await user2LoginRes.json();
    assert(user2Login.success && user2Login.data?.accessToken, 'Public User 2 authenticated');
    const user2Token = user2Login.data.accessToken;
    const user2Id = user2Login.data.user.id || user2Login.data.user._id;

    // ==============================================================
    // 2. PREPARE TEST APPLICATION & VERSIONS
    // ==============================================================
    console.log('\n--- 2. Finding or Initializing Test Application ---');
    let testApp = await App.findOne({ status: 'PUBLISHED' });
    if (!testApp) {
      testApp = await App.findOne();
    }
    testApp.status = 'PUBLISHED';
    testApp.visibility = 'PUBLIC';
    testApp.developer = developerId;
    await testApp.save();
    assert(testApp && testApp._id, `Using test application: ${testApp?.name} (${testApp?._id})`);
    const appId = testApp._id.toString();

    // Clean up previous test reviews for appId
    await Review.deleteMany({ application: appId });
    await ReviewVote.deleteMany({});
    await ReviewReport.deleteMany({});
    await DownloadSession.deleteMany({ application: appId });
    await DownloadEvent.deleteMany({ application: appId });

    // Seed verified download event for User 1 to test verified badge
    await DownloadEvent.create({
      application: appId,
      version: testApp.currentVersion || appId,
      user: user1Id,
      eventType: 'DOWNLOAD_COMPLETED',
      source: 'TEST',
    });

    // ==============================================================
    // 3. RATINGS AND REVIEWS WORKFLOW
    // ==============================================================
    console.log('\n--- 3. Testing Ratings and Reviews ---');

    // 3.1 Reject Invalid Rating (e.g. 0, 6, 4.5, string)
    const invalidRatingRes = await fetch(`${API_URL}/apps/${appId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        rating: 6,
        comment: 'Invalid rating test',
      }),
    });
    assert(invalidRatingRes.status === 400, 'Invalid rating (6) rejected with HTTP 400');

    const floatRatingRes = await fetch(`${API_URL}/apps/${appId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        rating: 4.5,
        comment: 'Decimal rating test',
      }),
    });
    assert(floatRatingRes.status === 400, 'Decimal rating (4.5) rejected with HTTP 400');

    // 3.2 Create Valid 5-star Review from User 1
    const createReviewRes = await fetch(`${API_URL}/apps/${appId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        rating: 5,
        title: 'Outstanding Application!',
        comment: 'Extremely fluid animations, reliable performance, and great privacy.',
      }),
    });
    const createReviewData = await createReviewRes.json();
    assert(createReviewRes.status === 201, 'User 1 created 5-star review (HTTP 201)');
    assert(createReviewData.data?.isVerifiedDownload === true, 'Review marked as Verified Download');
    const user1ReviewId = createReviewData.data?._id;

    // 3.3 Verify Aggregate Recalculation
    const appAfterRev1 = await App.findById(appId);
    assert(appAfterRev1.ratingAverage === 5, 'Application ratingAverage updated to 5.0');
    assert(appAfterRev1.ratingCount === 1, 'Application ratingCount updated to 1');
    assert(appAfterRev1.ratingDistribution[5] === 1, 'ratingDistribution[5] incremented to 1');

    // 3.4 Prevent Duplicate Review from Same User
    const duplicateReviewRes = await fetch(`${API_URL}/apps/${appId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        rating: 4,
        comment: 'Second review attempt',
      }),
    });
    assert(duplicateReviewRes.status === 400, 'Duplicate review from User 1 blocked (HTTP 400)');

    // 3.5 Edit Own Review
    const editReviewRes = await fetch(`${API_URL}/reviews/${user1ReviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        rating: 4,
        title: 'Updated: Very Solid Experience',
        comment: 'Updated review: After a week of use, it is a solid 4-star tool.',
      }),
    });
    assert(editReviewRes.status === 200, 'User 1 successfully edited their own review');

    const appAfterEdit = await App.findById(appId);
    assert(appAfterEdit.ratingAverage === 4, 'Rating average updated to 4.0 after edit');
    assert(appAfterEdit.ratingDistribution[4] === 1 && appAfterEdit.ratingDistribution[5] === 0, 'Rating distribution shifted from 5 to 4');

    // 3.6 Prevent Editing Another User's Review
    const unauthorizedEditRes = await fetch(`${API_URL}/reviews/${user1ReviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({
        rating: 1,
        comment: 'Malicious modification attempt',
      }),
    });
    assert(unauthorizedEditRes.status === 403, 'User 2 blocked from editing User 1 review (HTTP 403)');

    // 3.7 User 2 submits a review (5 stars)
    const user2ReviewRes = await fetch(`${API_URL}/apps/${appId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({
        rating: 5,
        title: 'Love this app',
        comment: 'Highly recommended for everyday productivity.',
      }),
    });
    const user2ReviewData = await user2ReviewRes.json();
    assert(user2ReviewRes.status === 201, 'User 2 created 5-star review');
    const user2ReviewId = user2ReviewData.data?._id;

    const appAfterRev2 = await App.findById(appId);
    assert(appAfterRev2.ratingCount === 2, 'Total ratingCount is now 2');
    assert(appAfterRev2.ratingAverage === 4.5, 'Rating average recalculated to 4.5');

    // ==============================================================
    // 4. HELPFUL VOTES & REPORTING
    // ==============================================================
    console.log('\n--- 4. Testing Helpful Votes & Abuse Reporting ---');

    // 4.1 Self-voting blocked
    const selfVoteRes = await fetch(`${API_URL}/reviews/${user1ReviewId}/helpful`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert(selfVoteRes.status === 400, 'Self-voting on own review blocked (HTTP 400)');

    // 4.2 User 2 marks User 1's review helpful
    const helpfulVoteRes = await fetch(`${API_URL}/reviews/${user1ReviewId}/helpful`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    const helpfulVoteData = await helpfulVoteRes.json();
    assert(helpfulVoteRes.status === 200 && helpfulVoteData.data?.helpfulCount === 1, 'User 2 voted review helpful');

    // 4.3 Duplicate vote blocked
    const duplicateVoteRes = await fetch(`${API_URL}/reviews/${user1ReviewId}/helpful`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert(duplicateVoteRes.status === 400, 'Duplicate helpful vote blocked (HTTP 400)');

    // 4.4 Unvote helpful
    const unvoteRes = await fetch(`${API_URL}/reviews/${user1ReviewId}/helpful`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    const unvoteData = await unvoteRes.json();
    assert(unvoteRes.status === 200 && unvoteData.data?.helpfulCount === 0, 'User 2 unvoted helpful');

    // 4.5 Report Review
    const reportRes = await fetch(`${API_URL}/reviews/${user1ReviewId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({
        reason: 'SPAM',
        description: 'Testing abuse reporting pipeline',
      }),
    });
    assert(reportRes.status === 200, 'User 2 reported review for moderation');

    // 4.6 Duplicate pending report blocked
    const duplicateReportRes = await fetch(`${API_URL}/reviews/${user1ReviewId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({ reason: 'SPAM' }),
    });
    assert(duplicateReportRes.status === 400, 'Duplicate pending report blocked (HTTP 400)');

    // ==============================================================
    // 5. DEVELOPER REPLIES & ADMIN MODERATION
    // ==============================================================
    console.log('\n--- 5. Testing Developer Replies & Admin Moderation ---');

    // Ensure dev.aura owns the app
    testApp.developer = developerId;
    await testApp.save();

    // 5.1 Developer Replies to Review
    const devReplyRes = await fetch(`${API_URL}/reviews/${user1ReviewId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({
        message: 'Thank you for your valuable feedback! We are releasing v1.2 soon with performance optimizations.',
      }),
    });
    const devReplyData = await devReplyRes.json();
    assert(devReplyRes.status === 200 && devReplyData.data?.developerReply?.message, 'Developer reply successfully saved');

    // 5.2 Unauthorized developer cannot reply
    const unauthReplyRes = await fetch(`${API_URL}/reviews/${user1ReviewId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`, // User2 is not developer of app
      },
      body: JSON.stringify({ message: 'Illegal reply' }),
    });
    assert(unauthReplyRes.status === 403, 'Unauthorized user blocked from posting developer reply');

    // 5.3 Admin Review Moderation List
    const adminReviewsRes = await fetch(`${API_URL}/admin/reviews`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminReviewsData = await adminReviewsRes.json();
    assert(adminReviewsRes.status === 200 && adminReviewsData.data?.reviews?.length > 0, 'Admin can fetch reviews list');

    // 5.4 Admin hides review
    const hideReviewRes = await fetch(`${API_URL}/admin/reviews/${user1ReviewId}/moderate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'HIDDEN', reason: 'Audit test' }),
    });
    assert(hideReviewRes.status === 200, 'Admin moderated review status to HIDDEN');

    // Verify rating recalculation excludes hidden reviews
    const appAfterHide = await App.findById(appId);
    assert(appAfterHide.ratingCount === 1 && appAfterHide.ratingAverage === 5, 'Rating recalculated excluding HIDDEN review');

    // Restore review to active
    await fetch(`${API_URL}/admin/reviews/${user1ReviewId}/moderate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });

    // ==============================================================
    // 6. SECURE APK DOWNLOAD SYSTEM
    // ==============================================================
    console.log('\n--- 6. Testing Secure APK Downloads ---');

    // 6.1 Initiate Secure Download
    const downloadInitRes = await fetch(`${API_URL}/apps/${appId}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ source: 'MARKETPLACE_TEST' }),
    });
    const downloadInitData = await downloadInitRes.json();
    assert(downloadInitRes.status === 200 && downloadInitData.data?.sessionToken, 'Secure download session initiated');
    assert(downloadInitData.data?.downloadUrl.startsWith('/api/downloads/file/'), 'Temporary secure download URL generated');
    const sessionToken = downloadInitData.data.sessionToken;

    // 6.2 Stream download file
    const streamRes = await fetch(`${ROOT_URL}${downloadInitData.data.downloadUrl}`);
    assert(streamRes.status === 200, 'Download stream endpoint returned HTTP 200 APK binary');

    // 6.3 Verify download count incremented on app
    const appAfterDownload = await App.findById(appId);
    assert(appAfterDownload.downloadCount >= 1, 'Application downloadCount successfully incremented');

    // 6.4 Complete download callback
    const completeRes = await fetch(`${API_URL}/downloads/${sessionToken}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert(completeRes.status === 200, 'Download confirmed completed');

    // 6.5 User Download History
    const historyRes = await fetch(`${API_URL}/me/downloads`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const historyData = await historyRes.json();
    assert(historyRes.status === 200 && historyData.data?.history?.length > 0, 'User download history contains downloaded app');

    // 6.6 Block Download for Quarantined APK
    const quarantinedVer = await AppVersion.create({
      app: appId,
      developer: developerId,
      version: '9.9.9-quarantine',
      versionName: '9.9.9-quarantine',
      versionCode: 999,
      fileName: 'quarantined-test.apk',
      originalFileName: 'quarantined-test.apk',
      fileSize: 1024,
      fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      storageKey: 'test/quarantined.apk',
      status: 'PUBLISHED',
      securityStatus: 'QUARANTINED',
      downloadStatus: 'BLOCKED',
    });

    const blockedDownloadRes = await fetch(`${API_URL}/apps/${appId}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ versionId: quarantinedVer._id }),
    });
    assert(blockedDownloadRes.status === 403, 'Quarantined/Blocked APK download rejected with HTTP 403');
    await AppVersion.findByIdAndDelete(quarantinedVer._id);

    // ==============================================================
    // 7. ADVANCED SEARCH AND DISCOVERY
    // ==============================================================
    console.log('\n--- 7. Testing Advanced Search & Discovery ---');

    // 7.1 Search by query
    const searchQueryRes = await fetch(`${API_URL}/search?q=${encodeURIComponent(testApp.name.split(' ')[0])}`);
    const searchQueryData = await searchQueryRes.json();
    assert(searchQueryRes.status === 200 && searchQueryData.data?.results?.length > 0, 'Multi-field search returned matching results');

    // 7.2 Search with minRating filter
    const searchRatingRes = await fetch(`${API_URL}/search?minRating=4`);
    const searchRatingData = await searchRatingRes.json();
    assert(searchRatingRes.status === 200, 'Search with minRating=4 filter executed');

    // 7.3 Autocomplete Suggestions
    const suggestRes = await fetch(`${API_URL}/search/suggestions?q=${encodeURIComponent(testApp.name.substring(0, 3))}`);
    const suggestData = await suggestRes.json();
    assert(suggestRes.status === 200 && (suggestData.data?.apps || suggestData.data?.popular), 'Autocomplete suggestions returned');

    // 7.4 Popular searches
    const popSearchRes = await fetch(`${API_URL}/search/popular`);
    const popSearchData = await popSearchRes.json();
    assert(popSearchRes.status === 200 && Array.isArray(popSearchData.data), 'Popular search queries returned');

    // 7.5 Discovery Feeds
    const popAppsRes = await fetch(`${API_URL}/apps/popular?limit=4`);
    const popAppsData = await popAppsRes.json();
    assert(popAppsRes.status === 200 && (Array.isArray(popAppsData.data) || Array.isArray(popAppsData.data?.apps)), 'Popular applications feed returned');

    const trendAppsRes = await fetch(`${API_URL}/apps/trending?limit=4`);
    const trendAppsData = await trendAppsRes.json();
    assert(trendAppsRes.status === 200 && (Array.isArray(trendAppsData.data) || Array.isArray(trendAppsData.data?.apps)), 'Trending applications feed returned');

    const newAppsRes = await fetch(`${API_URL}/apps/new?limit=4`);
    const newAppsData = await newAppsRes.json();
    assert(newAppsRes.status === 200 && (Array.isArray(newAppsData.data) || Array.isArray(newAppsData.data?.apps)), 'New releases feed returned');

    const updatedAppsRes = await fetch(`${API_URL}/apps/recently-updated?limit=4`);
    const updatedAppsData = await updatedAppsRes.json();
    assert(updatedAppsRes.status === 200 && (Array.isArray(updatedAppsData.data) || Array.isArray(updatedAppsData.data?.apps)), 'Recently updated feed returned');

    const relatedAppsRes = await fetch(`${API_URL}/apps/${appId}/related?limit=4`);
    const relatedAppsData = await relatedAppsRes.json();
    assert(relatedAppsRes.status === 200 && (Array.isArray(relatedAppsData.data) || Array.isArray(relatedAppsData.data?.apps)), 'Related applications feed returned');

    // ==============================================================
    // 8. APPLICATION & PLATFORM ANALYTICS
    // ==============================================================
    console.log('\n--- 8. Testing Analytics Telemetry ---');

    // 8.1 Ingest Analytics Event
    const eventRes = await fetch(`${API_URL}/analytics/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        eventType: 'APP_VIEW',
        appId,
        source: 'DIRECT',
      }),
    });
    assert(eventRes.status === 202, 'Analytics event ingested (HTTP 202 Accepted)');

    // 8.2 Developer Portfolio Overview
    const devAnalyticsRes = await fetch(`${API_URL}/developer/analytics?range=30d`, {
      headers: { Authorization: `Bearer ${devToken}` },
    });
    const devAnalyticsData = await devAnalyticsRes.json();
    assert(devAnalyticsRes.status === 200 && devAnalyticsData.data?.downloadConversion, 'Developer analytics overview returned with conversion rate');

    // 8.3 App-level Funnel & Version Breakdown
    const appAnalyticsRes = await fetch(`${API_URL}/developer/apps/${appId}/analytics?range=30d`, {
      headers: { Authorization: `Bearer ${devToken}` },
    });
    const appAnalyticsData = await appAnalyticsRes.json();
    assert(appAnalyticsRes.status === 200 && appAnalyticsData.data?.conversionRate, 'Single app funnel telemetry returned');

    // 8.4 Admin Platform Health & KPIs
    const adminAnalyticsRes = await fetch(`${API_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminAnalyticsData = await adminAnalyticsRes.json();
    assert(adminAnalyticsRes.status === 200 && adminAnalyticsData.data?.overview?.totalApplications >= 1, 'Admin platform KPIs returned');

    // ==============================================================
    // 9. SEO SITEMAP & ROBOTS.TXT
    // ==============================================================
    console.log('\n--- 9. Testing SEO Endpoints ---');

    // 9.1 Dynamic Sitemap XML
    const sitemapRes = await fetch(`${ROOT_URL}/sitemap.xml`);
    const sitemapXml = await sitemapRes.text();
    assert(sitemapRes.status === 200 && sitemapXml.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Dynamic /sitemap.xml served with valid XML header');
    assert(sitemapXml.includes('/apps/'), '/sitemap.xml includes application URLs');

    // 9.2 Robots.txt
    const robotsRes = await fetch(`${ROOT_URL}/robots.txt`);
    const robotsTxt = await robotsRes.text();
    assert(robotsRes.status === 200 && robotsTxt.includes('Disallow: /admin/'), '/robots.txt served disallowing private routes');

    // ==============================================================
    // 10. BACKGROUND JOBS EXECUTION
    // ==============================================================
    console.log('\n--- 10. Testing Phase 9 Background Jobs ---');

    const revJobResult = await runReviewAggregationJob();
    assert(revJobResult.success, 'runReviewAggregationJob completed successfully');

    const trendJobResult = await runTrendingAppsJob();
    assert(trendJobResult.success, 'runTrendingAppsJob completed successfully');

    const popJobResult = await runPopularAppsJob();
    assert(popJobResult.success, 'runPopularAppsJob completed successfully');

    const analyticsJobResult = await runAnalyticsAggregationJob();
    assert(analyticsJobResult.success, 'runAnalyticsAggregationJob completed successfully');

    const sitemapJobResult = await runSitemapJob();
    assert(sitemapJobResult.success, 'runSitemapJob completed successfully');

    // ==============================================================
    // FINAL SUMMARY
    // ==============================================================
    console.log('\n===============================================================');
    console.log(`   PHASE 9 TEST RUN RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error running Phase 9 tests:', err);
    process.exit(1);
  }
}

runPhase9Tests();
