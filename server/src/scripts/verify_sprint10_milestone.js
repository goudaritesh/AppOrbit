import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import App from '../models/App.js';
import AppVersion from '../models/AppVersion.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import DailyAnalytics from '../models/DailyAnalytics.js';
import ActivityLog from '../models/ActivityLog.js';
import SystemMetric from '../models/SystemMetric.js';

import EventTrackingService from '../services/eventTrackingService.js';
import ActivityLogService from '../services/activityLogService.js';
import MonitoringService from '../services/monitoringService.js';
import AnalyticsService from '../modules/analytics/analytics.service.js';

import { runDailyAnalyticsAggregation } from '../jobs/analyticsAggregationJob.js';
import { runRevenueAnalyticsJob } from '../jobs/revenueAnalyticsJob.js';
import { runSystemHealthJob } from '../jobs/systemHealthJob.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runSprint10Verification() {
  console.log('===============================================================');
  console.log('📊 APPORBIT SPRINT 10: ANALYTICS, INSIGHTS & MONITORING VERIFICATION');
  console.log('===============================================================');

  await connectDB();

  try {
    // -------------------------------------------------------------
    // Setup Test Developer, App, and Plan
    // -------------------------------------------------------------
    console.log('\n[Setup] Initializing test entities for telemetry testing...');
    const testEmail = `dev_telemetry_${Date.now()}@apporbit.io`;
    const developer = await User.findOneAndUpdate(
      { email: testEmail },
      {
        name: 'Telemetry Developer',
        email: testEmail,
        passwordHash: 'hashed_pw',
        role: 'DEVELOPER',
        accountStatus: 'ACTIVE',
      },
      { upsert: true, new: true }
    );

    const testApp = await App.findOneAndUpdate(
      { slug: `test-app-${Date.now()}` },
      {
        name: 'PulseGuard Telemetry Edition',
        slug: `pulseguard-${Date.now()}`,
        developer: developer._id,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        category: new mongoose.Types.ObjectId(),
        viewCount: 100,
        downloadCount: 65,
        ratingAverage: 4.8,
        ratingCount: 15,
      },
      { upsert: true, new: true }
    );

    // Ensure Plans exist
    let goldPlan = await SubscriptionPlan.findOne({
      $or: [{ tier: 'GOLD' }, { name: /Gold/i }]
    });
    if (!goldPlan) {
      goldPlan = await SubscriptionPlan.create({
        name: `Gold Studio Plan ${Date.now()}`,
        slug: `gold-plan-${Date.now()}`,
        tier: 'GOLD',
        price: 599,
        appLimit: 10,
        billingPeriod: 'MONTHLY',
        isActive: true,
      });
    }

    // -------------------------------------------------------------
    // [1/10] Central Event Tracking & All 10 Core Event Types
    // -------------------------------------------------------------
    console.log('\n[1/10] Testing Central Event Tracking System (10 Core Event Types)...');
    const eventsToEmit = [
      { type: 'APP_VIEWED', payload: { appId: testApp._id, userId: developer._id, source: 'DIRECT' } },
      { type: 'APP_DOWNLOADED', payload: { appId: testApp._id, userId: developer._id, source: 'MARKETPLACE' } },
      { type: 'SEARCH_PERFORMED', payload: { userId: developer._id, metadata: { query: 'vpn shield', resultsCount: 4 } } },
      { type: 'SEARCH_PERFORMED', payload: { userId: developer._id, metadata: { query: 'nonexistent app xyz', resultsCount: 0, isZeroResult: true } } },
      { type: 'APP_SHARED', payload: { appId: testApp._id, userId: developer._id, source: 'SHARE_BUTTON' } },
      { type: 'REVIEW_CREATED', payload: { appId: testApp._id, userId: developer._id, metadata: { rating: 5 } } },
      { type: 'APP_PUBLISHED', payload: { appId: testApp._id, developerId: developer._id } },
      { type: 'APP_APPROVED', payload: { appId: testApp._id, userId: developer._id } },
      { type: 'PAYMENT_SUCCESS', payload: { userId: developer._id, metadata: { amount: 599, planId: goldPlan._id } } },
      { type: 'SUBSCRIPTION_CREATED', payload: { userId: developer._id, metadata: { planTier: 'GOLD' } } },
      { type: 'SUPPORT_TICKET_CREATED', payload: { userId: developer._id, metadata: { category: 'BILLING' } } },
    ];

    for (const item of eventsToEmit) {
      const recorded = await EventTrackingService.track(item.type, {
        ...item.payload,
        skipDebounce: true,
      });
      assert(recorded && recorded.eventType === item.type, `Tracked event: ${item.type}`);
    }

    // -------------------------------------------------------------
    // [2/10] Developer Analytics & Conversion Rate Calculation
    // -------------------------------------------------------------
    console.log('\n[2/10] Testing Developer Analytics & Conversion Rate...');
    const devAnalytics = await AnalyticsService.getDeveloperOverview(developer._id, '30d');
    assert(devAnalytics.totalApps >= 1, 'Developer totalApps reported correctly');
    assert(devAnalytics.totalViews >= 100, 'Developer totalViews aggregated from apps');
    assert(devAnalytics.totalDownloads >= 65, 'Developer totalDownloads aggregated from apps');
    assert(
      devAnalytics.downloadConversion.includes('%') || !isNaN(parseFloat(devAnalytics.downloadConversion)),
      `Download Conversion Rate calculated: ${devAnalytics.downloadConversion}`
    );
    assert(devAnalytics.topApplications.length > 0, 'Top applications list returned');

    // -------------------------------------------------------------
    // [3/10] App-Level Analytics & Traffic Sources
    // -------------------------------------------------------------
    console.log('\n[3/10] Testing App-Level Analytics & Traffic Breakdown...');
    const appAnalytics = await AnalyticsService.getAppAnalytics(testApp._id, developer._id, '30d');
    assert(appAnalytics.application.name === testApp.name, 'App analytics application details match');
    assert(appAnalytics.views >= 100, 'App views reported');
    assert(appAnalytics.downloads >= 65, 'App downloads reported');
    assert(appAnalytics.conversionRate.includes('%'), `App conversion rate computed: ${appAnalytics.conversionRate}`);
    assert(typeof appAnalytics.trafficSources === 'object', 'Traffic sources breakdown returned');

    // -------------------------------------------------------------
    // [4/10] Admin Platform Overview Analytics
    // -------------------------------------------------------------
    console.log('\n[4/10] Testing Admin Platform Overview Analytics...');
    const adminAnalytics = await AnalyticsService.getAdminPlatformAnalytics('30d');
    const ov = adminAnalytics.overview;
    assert(ov.totalUsers >= 1, `Total platform users reported: ${ov.totalUsers}`);
    assert(ov.totalDevelopers >= 1, `Total developers reported: ${ov.totalDevelopers}`);
    assert(ov.totalApplications >= 1, `Total applications reported: ${ov.totalApplications}`);
    assert(ov.publishedApplications >= 1, `Published applications reported: ${ov.publishedApplications}`);
    assert(ov.totalDownloads >= 0, `Total downloads reported: ${ov.totalDownloads}`);

    // -------------------------------------------------------------
    // [5/10] Revenue Analytics Module
    // -------------------------------------------------------------
    console.log('\n[5/10] Testing Revenue Analytics Module (Sprint 8 Payment Integration)...');
    // Create a mock confirmed payment to guarantee data
    await Payment.create({
      paymentId: `pay_${Date.now()}_test`,
      developer: developer._id,
      plan: goldPlan._id,
      amount: 599,
      status: 'SUCCESS',
      provider: 'RAZORPAY',
      method: 'UPI',
    });

    const revenueAnalytics = await AnalyticsService.getRevenueAnalytics('30d');
    assert(revenueAnalytics.totalRevenue >= 599, `Total revenue tracked: ₹${revenueAnalytics.totalRevenue}`);
    assert(revenueAnalytics.revenueThisMonth >= 599, `Revenue this month tracked: ₹${revenueAnalytics.revenueThisMonth}`);
    assert(revenueAnalytics.plans.GOLD.amount >= 599, `Gold plan revenue tracked: ₹${revenueAnalytics.plans.GOLD.amount}`);
    assert(revenueAnalytics.successfulPayments >= 1, `Successful payments counted: ${revenueAnalytics.successfulPayments}`);

    // -------------------------------------------------------------
    // [6/10] Search Insights & Zero-Result Analytics
    // -------------------------------------------------------------
    console.log('\n[6/10] Testing Search Insights & Query Analytics...');
    const searchAnalytics = await AnalyticsService.getSearchAnalytics('30d');
    assert(searchAnalytics.totalSearches >= 2, `Total search volume tracked: ${searchAnalytics.totalSearches}`);
    const hasVpnSearch = searchAnalytics.topSearches.some((s) => s.query.includes('vpn'));
    assert(hasVpnSearch, 'Recorded "vpn shield" query found in top searches');
    const zeroResults = searchAnalytics.zeroResultQueries;
    assert(zeroResults.length >= 1, 'Zero-result query tracked for demand analysis');

    // -------------------------------------------------------------
    // [7/10] Activity Logging System
    // -------------------------------------------------------------
    console.log('\n[7/10] Testing Activity Logging & Audit Trail System...');
    const log1 = await ActivityLogService.logActivity({
      actorId: developer._id,
      actorRole: 'DEVELOPER',
      actorEmail: developer.email,
      action: ActivityLogService.ACTIONS.DEVELOPER_PUBLISHED_APP,
      resourceType: 'APP',
      resourceId: testApp._id,
      reason: 'Version 1.0 submitted for review',
    });
    assert(log1 && log1.action === 'DEVELOPER_PUBLISHED_APP', 'Recorded DEVELOPER_PUBLISHED_APP activity log');

    const log2 = await ActivityLogService.logActivity({
      actorId: developer._id,
      actorRole: 'ADMIN',
      actorEmail: 'admin@apporbit.io',
      action: ActivityLogService.ACTIONS.ADMIN_APPROVED_APP,
      resourceType: 'APP',
      resourceId: testApp._id,
      reason: 'Verified 7-point security requirements',
    });
    assert(log2 && log2.action === 'ADMIN_APPROVED_APP', 'Recorded ADMIN_APPROVED_APP activity log');

    const queryLogs = await ActivityLogService.getActivityLogs({ limit: 10 });
    assert(queryLogs.logs.length >= 2, `Activity logs query returned ${queryLogs.logs.length} entries`);
    assert(queryLogs.pagination.total >= 2, 'Activity logs pagination total verified');

    // -------------------------------------------------------------
    // [8/10] Error Monitoring & System Health Diagnostics
    // -------------------------------------------------------------
    console.log('\n[8/10] Testing Error Monitoring & System Health Diagnostics...');
    // Capture sample categorized errors
    MonitoringService.captureError(new Error('Sample test API failure'), {
      path: '/api/v1/test',
      method: 'GET',
      statusCode: 500,
      category: 'API_ERROR',
    });
    MonitoringService.captureError(new Error('Simulated payment webhook timeout'), {
      category: 'PAYMENT_FAILURE',
    });

    const health = await MonitoringService.getSystemHealth();
    assert(['HEALTHY', 'DEGRADED'].includes(health.status), `System health evaluated as: ${health.status}`);
    assert(health.api.status === 'HEALTHY', 'API status reported HEALTHY');
    assert(health.database.status === 'CONNECTED', 'Database reported CONNECTED');
    assert(health.database.pingMs >= 0, `Database ping latency: ${health.database.pingMs} ms`);
    assert(health.storage.accessible === true, 'Local storage accessible verified');
    assert(health.errorSummary.totals.apiErrors >= 1, 'Error pool counted API errors');
    assert(health.errorSummary.totals.paymentFailures >= 1, 'Error pool counted payment failures');

    // -------------------------------------------------------------
    // [9/10] Daily Analytics Aggregation Background Job
    // -------------------------------------------------------------
    console.log('\n[9/10] Testing Daily Analytics Aggregation Job...');
    const aggResult = await runDailyAnalyticsAggregation();
    assert(aggResult.success === true, `Daily aggregation executed successfully (${aggResult.appsProcessed} apps processed)`);
    const dailyRollups = await DailyAnalytics.find({ application: testApp._id });
    assert(dailyRollups.length > 0, `Found ${dailyRollups.length} DailyAnalytics documents created for test app`);
    assert(dailyRollups[0].views >= 1, 'DailyAnalytics aggregated views count');

    // -------------------------------------------------------------
    // [10/10] System Health Snapshot & Revenue Background Jobs
    // -------------------------------------------------------------
    console.log('\n[10/10] Testing System Health Snapshot & Revenue Jobs...');
    const revJobResult = await runRevenueAnalyticsJob();
    assert(revJobResult.success === true, 'Revenue rollup job executed successfully');

    const healthJobResult = await runSystemHealthJob();
    assert(healthJobResult.success === true, 'System health snapshot job executed successfully');
    const snapshotCount = await SystemMetric.countDocuments();
    assert(snapshotCount >= 1, `SystemMetric document persisted in database (${snapshotCount} records)`);

    console.log('\n===============================================================');
    console.log('🎉 SPRINT 10 FULLY VERIFIED — 100% PASS RATE (ALL 10 PRIORITIES)');
    console.log('===============================================================');
  } catch (err) {
    console.error('❌ SPRINT 10 VERIFICATION ERROR:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runSprint10Verification();
