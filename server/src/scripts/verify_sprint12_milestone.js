import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import FeedbackService from '../services/feedbackService.js';
import BugService from '../services/bugService.js';
import BetaAnalyticsService from '../services/betaAnalyticsService.js';
import { runBetaMetricsJob } from '../jobs/betaMetricsJob.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runSprint12Verification() {
  console.log('========================================================================');
  console.log('🚀 APPORBIT SPRINT 12: BETA LAUNCH, REAL USER TESTING & PRODUCT GROWTH');
  console.log('========================================================================');

  await connectDB();

  try {
    // -------------------------------------------------------------
    // [1/10] Testing Beta Tester User Invariants
    // -------------------------------------------------------------
    console.log('\n[1/10] Testing Beta Tester Identity & Program Invariants...');
    const betaEmail = `beta_tester_${Date.now()}@apporbit.io`;
    const betaUser = await User.create({
      name: 'Elena Rostova (Beta Lead)',
      email: betaEmail,
      password: 'BetaUserSecure2026!',
      role: 'USER',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      isBetaTester: true,
      betaJoinedAt: new Date(),
      betaStage: 'ACTIVE',
    });

    assert(betaUser.isBetaTester === true, 'User marked as active beta tester');
    assert(betaUser.betaStage === 'ACTIVE', 'User assigned ACTIVE beta stage');
    assert(betaUser.betaJoinedAt instanceof Date, 'betaJoinedAt timestamp recorded');

    // -------------------------------------------------------------
    // [2/10] Testing User Feedback Submission & Validation
    // -------------------------------------------------------------
    console.log('\n[2/10] Testing Feedback Collection & Validation...');
    const feedback1 = await FeedbackService.submitFeedback({
      user: betaUser,
      type: 'FEATURE_REQUEST',
      category: 'DISCOVERY',
      rating: 5,
      message: 'Love the app exploration speed! Would love to see dark mode preview screenshots directly in the card.',
    });

    assert(feedback1.type === 'FEATURE_REQUEST', 'Feedback type recorded as FEATURE_REQUEST');
    assert(feedback1.rating === 5, 'Star rating recorded as 5');
    assert(feedback1.status === 'NEW', 'Feedback initial status is NEW');
    assert(feedback1.name === 'Elena Rostova (Beta Lead)', 'User name populated from session');

    // Test validation: Empty message rejected
    let emptyCaught = false;
    try {
      await FeedbackService.submitFeedback({
        user: betaUser,
        message: '   ',
      });
    } catch (err) {
      emptyCaught = true;
      assert(err.statusCode === 400, 'Empty feedback message rejected with 400 Bad Request');
    }
    assert(emptyCaught, 'Feedback validation correctly enforces non-empty message');

    // -------------------------------------------------------------
    // [3/10] Testing Feedback Administrative Triage & Upvoting
    // -------------------------------------------------------------
    console.log('\n[3/10] Testing Feedback Management & Upvoting...');
    const upvoted = await FeedbackService.upvoteFeedback(feedback1._id);
    assert(upvoted.upvotes === 1, 'Feedback upvote incremented to 1');

    const updatedFeedback = await FeedbackService.updateFeedbackStatus(feedback1._id, {
      status: 'UNDER_CONSIDERATION',
      adminNotes: 'Discussed with design team; queued for v0.9 milestone.',
      adminResponse: 'Great suggestion Elena! We are actively prototyping card preview carousels.',
    });
    assert(updatedFeedback.status === 'UNDER_CONSIDERATION', 'Feedback status updated to UNDER_CONSIDERATION');
    assert(updatedFeedback.adminResponse.includes('prototyping'), 'Admin public response saved');

    // Query feedback list
    const feedbackList = await FeedbackService.getFeedbacks({ type: 'FEATURE_REQUEST' });
    assert(feedbackList.data.length >= 1, 'Query filtered by type returned submitted feedback');
    assert(feedbackList.pagination.total >= 1, 'Pagination envelope properly formatted');

    // -------------------------------------------------------------
    // [4/10] Testing Structured Bug Report Submission & Severities
    // -------------------------------------------------------------
    console.log('\n[4/10] Testing Bug Reporting Engine & Severity Grading...');
    const bugReport = await BugService.submitBugReport({
      user: betaUser,
      title: 'APK download progress stops at 99% on unstable 4G',
      description: 'When switching cell towers while downloading large APK (>150MB), connection resets without auto-resume.',
      stepsToReproduce: '1. Start downloading 180MB APK\n2. Throttle network to 2G/3G\n3. Observe download stalls at 99%',
      expectedResult: 'Stream should resume or present retry prompt with partial range request',
      actualResult: 'Browser download manager shows Network Error',
      severity: 'HIGH',
      deviceInfo: {
        os: 'Android 14 (OneUI 6.1)',
        browser: 'Chrome Mobile 128.0',
        deviceType: 'Samsung Galaxy S24',
      },
    });

    assert(bugReport.bugId && bugReport.bugId.startsWith('BUG-'), `Bug report issued human-readable ID: ${bugReport.bugId}`);
    assert(bugReport.severity === 'HIGH', 'Bug severity graded as HIGH');
    assert(bugReport.status === 'OPEN', 'Bug initial status marked OPEN');
    assert(bugReport.deviceInfo.os === 'Android 14 (OneUI 6.1)', 'Device info captured');

    // -------------------------------------------------------------
    // [5/10] Testing Bug Triage & Lifecycle Resolution
    // -------------------------------------------------------------
    console.log('\n[5/10] Testing Bug Triage, Progress Tracking & Resolution...');
    // Admin sets bug to IN_PROGRESS
    const inProgressBug = await BugService.updateBugReport(bugReport._id, {
      status: 'IN_PROGRESS',
      adminNotes: 'Investigating HTTP Range header streaming support in download.service.js',
    });
    assert(inProgressBug.status === 'IN_PROGRESS', 'Bug status transitioned to IN_PROGRESS');

    // Admin resolves bug
    const resolvedBug = await BugService.updateBugReport(bugReport._id, {
      status: 'RESOLVED',
      adminNotes: 'Added Range request support for paused and interrupted APK streams.',
      adminUser: betaUser,
    });
    assert(resolvedBug.status === 'RESOLVED', 'Bug status transitioned to RESOLVED');
    assert(resolvedBug.resolvedAt instanceof Date, 'Bug resolution timestamp recorded');

    // -------------------------------------------------------------
    // [6/10] Testing Critical Severity Incident Response Register
    // -------------------------------------------------------------
    console.log('\n[6/10] Testing Incident Response Management...');
    const incident = await BetaAnalyticsService.createIncident({
      title: 'Database connection pool saturation during burst testing',
      description: 'Mongoose maxPoolSize reached during 500 concurrent synthetic requests, triggering intermittent 503s.',
      severity: 'CRITICAL',
      affectedComponents: ['MONGODB', 'API_CORE'],
      affectedUsersEstimate: 15,
      rootCause: 'Default maxPoolSize was set to 10 connections rather than scaling to 100.',
    });

    assert(incident.incidentId && incident.incidentId.startsWith('INC-'), `Incident issued tracking ID: ${incident.incidentId}`);
    assert(incident.severity === 'CRITICAL', 'Incident declared with CRITICAL severity');
    assert(incident.status === 'INVESTIGATING', 'Incident entered INVESTIGATING state');
    assert(incident.timeline.length === 1, 'Initial incident declaration timeline event logged');

    // Update incident with resolution
    const resolvedIncident = await BetaAnalyticsService.updateIncident(incident._id, {
      status: 'RESOLVED',
      solution: 'Increased maxPoolSize to 100 and enabled connection keep-alive tuning.',
      timelineMessage: 'Database pool capacity verified under 1000 simulated clients.',
      adminUser: betaUser,
    });
    assert(resolvedIncident.status === 'RESOLVED', 'Incident transitioned to RESOLVED');
    assert(resolvedIncident.timeline.length === 2, 'Post-mortem resolution message appended to timeline');

    // -------------------------------------------------------------
    // [7/10] Testing Beta Analytics & Growth Funnels
    // -------------------------------------------------------------
    console.log('\n[7/10] Testing Beta Analytics Aggregation & Funnels...');
    const analytics = await BetaAnalyticsService.getBetaAnalytics();

    assert(analytics.version === 'v0.8.0-beta', 'Platform version reports v0.8.0-beta');
    assert(analytics.overview.betaUsers >= 1, `Beta users tracked: ${analytics.overview.betaUsers}`);
    assert(analytics.bugs.total >= 1, `Bug reports tracked in beta: ${analytics.bugs.total}`);
    assert(analytics.feedback.total >= 1, `Feedback reports tracked in beta: ${analytics.feedback.total}`);
    assert(analytics.feedback.averageRating >= 1 && analytics.feedback.averageRating <= 5, `Feedback average rating: ${analytics.feedback.averageRating} / 5.0`);

    // Verify Funnel structures
    assert(Array.isArray(analytics.funnels.userFunnel), 'User conversion funnel array provided');
    assert(analytics.funnels.userFunnel.length === 4, 'User funnel has 4 stages');
    assert(Array.isArray(analytics.funnels.developerFunnel), 'Developer conversion funnel array provided');
    assert(analytics.funnels.developerFunnel.length === 4, 'Developer funnel has 4 stages');

    // -------------------------------------------------------------
    // [8/10] Testing Scheduled Beta Metrics Snapshot Job
    // -------------------------------------------------------------
    console.log('\n[8/10] Testing Beta Metrics Background Job Execution...');
    const jobResult = await runBetaMetricsJob();
    assert(jobResult && jobResult.version === 'v0.8.0-beta', 'BetaMetricsJob executed and generated telemetry snapshot');

    // -------------------------------------------------------------
    // [9/10] Testing Clean Queries with Pagination & Filtering
    // -------------------------------------------------------------
    console.log('\n[9/10] Testing Filtered Bug Queries for Admin Center...');
    const resolvedQuery = await BugService.getBugReports({ status: 'RESOLVED' });
    assert(resolvedQuery.data.some((b) => b.status === 'RESOLVED'), 'Filtered query returned resolved bugs');

    const criticalBugs = await BugService.getBugReports({ severity: 'CRITICAL' });
    assert(Array.isArray(criticalBugs.data), 'Severity filtered query returns clean list');

    // -------------------------------------------------------------
    // [10/10] Testing Incident Retrieval
    // -------------------------------------------------------------
    console.log('\n[10/10] Testing Incident Center Retrieval...');
    const incidents = await BetaAnalyticsService.getIncidents();
    assert(incidents.length >= 1, `Incidents registry retrieved ${incidents.length} record(s)`);
    assert(incidents[0].timeline.length > 0, 'Incident timeline retrieved with chronological logs');

    console.log('\n========================================================================');
    console.log('🎉 SPRINT 12 FULLY VERIFIED — 100% PASS RATE (ALL 10 CRITERIA PASSED)');
    console.log('========================================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ SPRINT 12 VERIFICATION FAILED:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

runSprint12Verification();
