import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { App } from '../models/App.js';
import { AppVersion } from '../models/AppVersion.js';
import { SecurityReport } from '../models/SecurityReport.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { Subscription } from '../models/Subscription.js';
import { Payment } from '../models/Payment.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { SupportMessage } from '../models/SupportMessage.js';
import { PlatformReport } from '../models/PlatformReport.js';
import { AuditLog } from '../models/AuditLog.js';
import { PlatformSettings } from '../models/PlatformSettings.js';
import { SubscriptionLimitService } from '../services/admin/subscriptionLimitService.js';

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('===============================================================');
  console.log('   APPORBIT — PHASE 7 AUTOMATED E2E & RBAC TEST SUITE        ');
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
    console.log('\n--- 1. Authenticating Roles (User, Developer, Admin) ---');

    // 1.1 Authenticate Developer
    const devLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dev.aura@apporbit.io', password: 'Password123!' })
    });
    const devLogin = await devLoginRes.json();
    assert(devLogin.success && devLogin.data?.accessToken, 'Developer authenticated');
    const devToken = devLogin.data.accessToken;
    const developerId = devLogin.data.user.id || devLogin.data.user._id;

    // 1.2 Authenticate Normal User
    let normalUser = await User.findOne({ email: 'public.testuser@apporbit.io' });
    if (!normalUser) {
      normalUser = await User.create({
        name: 'Test Public User',
        email: 'public.testuser@apporbit.io',
        password: 'Password123!',
        role: 'USER',
        accountStatus: 'ACTIVE',
        emailVerified: true
      });
    } else {
      normalUser.accountStatus = 'ACTIVE';
      normalUser.emailVerified = true;
      normalUser.password = 'Password123!';
      await normalUser.save();
    }
    const userLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalUser.email, password: 'Password123!' })
    });
    const userLogin = await userLoginRes.json();
    assert(userLogin.success && userLogin.data?.accessToken, 'Normal User authenticated');
    const userToken = userLogin.data.accessToken;

    // 1.3 Authenticate Admin (Super Admin)
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@apporbit.io', password: 'AppOrbitAdmin2026!' })
    });
    const adminLogin = await adminLoginRes.json();
    assert(adminLogin.success && adminLogin.data?.accessToken, 'Admin authenticated');
    const adminToken = adminLogin.data.accessToken;

    // 1.4 Create or find a Moderator admin user
    let modUser = await User.findOne({ email: 'moderator.test@apporbit.io' });
    if (!modUser) {
      modUser = await User.create({
        name: 'Moderator Reviewer',
        email: 'moderator.test@apporbit.io',
        password: 'Password123!',
        role: 'MODERATOR',
        accountStatus: 'ACTIVE',
        emailVerified: true
      });
    } else {
      modUser.role = 'MODERATOR';
      modUser.accountStatus = 'ACTIVE';
      modUser.emailVerified = true;
      modUser.password = 'Password123!';
      await modUser.save();
    }
    const modLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'moderator.test@apporbit.io', password: 'Password123!' })
    });
    const modLogin = await modLoginRes.json();
    assert(modLogin.success && modLogin.data?.accessToken, 'Moderator authenticated');
    const modToken = modLogin.data.accessToken;

    // ==============================================================
    // 2. STRICT RBAC & GRANULAR PERMISSIONS TESTS
    // ==============================================================
    console.log('\n--- 2. Testing Strict RBAC & Permission Enforcement ---');

    // 2.1 Developer accessing admin API should be 403 Forbidden
    const devAdminRes = await fetch(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${devToken}` }
    });
    assert(devAdminRes.status === 403, 'Developer blocked from /api/admin/dashboard with 403 Forbidden');

    // 2.2 Normal user accessing admin API should be 403 Forbidden
    const userAdminRes = await fetch(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(userAdminRes.status === 403, 'Normal user blocked from /api/admin/dashboard with 403 Forbidden');

    // 2.3 Super Admin accessing admin API succeeds
    const superAdminRes = await fetch(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(superAdminRes.status === 200, 'Super Admin granted access to /api/admin/dashboard (200 OK)');

    // 2.4 Granular check: Moderator can read apps...
    const modAppsRes = await fetch(`${API_URL}/admin/apps`, {
      headers: { Authorization: `Bearer ${modToken}` }
    });
    assert(modAppsRes.status === 200, 'Moderator permitted to access /api/admin/apps (200 OK)');

    // 2.5 Granular check: Moderator cannot access payment management (requires PAYMENT_READ)
    const modPaymentsRes = await fetch(`${API_URL}/admin/payments`, {
      headers: { Authorization: `Bearer ${modToken}` }
    });
    assert(modPaymentsRes.status === 403, 'Moderator blocked from /api/admin/payments with 403 INSUFFICIENT_PERMISSION');

    // ==============================================================
    // 3. ADMIN DASHBOARD & ANALYTICS
    // ==============================================================
    console.log('\n--- 3. Testing Admin Dashboard & Deep Analytics APIs ---');

    const dashRes = await fetch(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dashData = await dashRes.json();
    assert(
      dashData.success &&
      dashData.data?.users !== undefined &&
      dashData.data?.developers !== undefined &&
      dashData.data?.applications !== undefined &&
      dashData.data?.revenue !== undefined,
      'Admin dashboard returns comprehensive KPI telemetry'
    );

    const analyticsRes = await fetch(`${API_URL}/admin/dashboard/analytics?range=30d`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const analyticsData = await analyticsRes.json();
    assert(
      analyticsData.success &&
      Array.isArray(analyticsData.data?.userGrowth) &&
      Array.isArray(analyticsData.data?.downloadsOverTime) &&
      Array.isArray(analyticsData.data?.categoryBreakdown) &&
      Array.isArray(analyticsData.data?.revenueByPlan),
      'Admin analytics returns 30d time series, category breakdown, and revenue distributions'
    );

    // ==============================================================
    // 4. APPLICATION MODERATION WORKFLOW
    // ==============================================================
    console.log('\n--- 4. Testing Application Moderation Lifecycle ---');

    // Find or create an application to moderate
    let testApp = await App.findOne({ developer: developerId });
    if (!testApp) {
      testApp = await App.create({
        developer: developerId,
        title: 'Mod Test App',
        name: 'Mod Test App',
        slug: 'mod-test-app-' + Date.now(),
        packageName: 'com.apporbit.modtest',
        description: 'Testing administrative moderation workflow',
        shortDescription: 'Short description for testing',
        category: 'TOOLS',
        status: 'SUBMITTED',
        visibility: 'PUBLIC'
      });
    }
    const testAppId = testApp._id.toString();

    // 4.1 Admin lists applications
    const appsListRes = await fetch(`${API_URL}/admin/apps?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const appsListData = await appsListRes.json();
    assert(appsListData.success && Array.isArray(appsListData.data?.apps), 'Admin successfully retrieved paginated apps');

    // 4.2 Admin views application details
    const appDetailRes = await fetch(`${API_URL}/admin/apps/${testAppId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const appDetailData = await appDetailRes.json();
    assert(appDetailData.success && appDetailData.data?.app?._id === testAppId, 'Admin retrieved full application details with moderation history');

    // 4.3 Request Changes
    const reqChangesRes = await fetch(`${API_URL}/admin/apps/${testAppId}/request-changes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        reason: 'Please provide high-resolution screenshots and update short description.',
        category: 'CONTENT'
      })
    });
    const reqChangesData = await reqChangesRes.json();
    assert(
      reqChangesData.success && reqChangesData.data?.app?.status === 'CHANGES_REQUESTED',
      'Admin requested changes -> status transitioned to CHANGES_REQUESTED'
    );

    // 4.4 Reject Application
    const rejectRes = await fetch(`${API_URL}/admin/apps/${testAppId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        reason: 'App description violates advertising policy guidelines.',
        category: 'POLICY'
      })
    });
    const rejectData = await rejectRes.json();
    assert(
      rejectData.success && rejectData.data?.app?.status === 'REJECTED',
      'Admin rejected application -> status transitioned to REJECTED'
    );

    // 4.5 Approve Application
    const approveRes = await fetch(`${API_URL}/admin/apps/${testAppId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        publishImmediately: false,
        notes: 'Compliance guidelines satisfied. Approved for distribution.'
      })
    });
    const approveData = await approveRes.json();
    assert(
      approveData.success && approveData.data?.app?.status === 'APPROVED',
      'Admin approved application -> status transitioned to APPROVED'
    );

    // 4.6 Block Application & Test Public Lockdown
    const blockRes = await fetch(`${API_URL}/admin/apps/${testAppId}/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        reason: 'Severe copyright violation detected after DMCA notice.',
        category: 'COPYRIGHT'
      })
    });
    const blockData = await blockRes.json();
    assert(
      blockData.success && blockData.data?.app?.status === 'BLOCKED',
      'Admin blocked application -> status transitioned to BLOCKED'
    );

    // 4.7 Public Isolation: Blocked app must NOT appear in public marketplace
    const publicMarketRes = await fetch(`${API_URL}/apps?search=Mod+Test+App`);
    const publicMarketData = await publicMarketRes.json();
    const foundInMarketplace = publicMarketData.data?.apps?.some((a) => a._id.toString() === testAppId);
    assert(!foundInMarketplace, 'BLOCKED application is completely excluded from public marketplace queries');

    // 4.8 Download Eligibility Lockdown: Blocked app download must be rejected
    // Mock or check an existing version
    let testVersion = await AppVersion.findOne({ app: testAppId });
    if (!testVersion) {
      testVersion = await AppVersion.create({
        app: testAppId,
        developer: developerId,
        versionName: '1.0.0',
        versionCode: 1,
        packageName: 'com.apporbit.modtest',
        apkFileKey: 'apks/test/modtest.apk',
        apkFileUrl: 'https://storage.apporbit.io/apks/test/modtest.apk',
        apkSize: 1048576,
        apkHashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        status: 'ACTIVE',
        securityStatus: 'PASSED'
      });
    }

    const downloadRes = await fetch(`${API_URL}/developer/apps/${testAppId}/versions/${testVersion._id}/download-url`, {
      headers: { Authorization: `Bearer ${devToken}` }
    });
    assert(downloadRes.status === 403, 'Download gatekeeper returns 403 APP_BLOCKED when application is blocked');

    // Restore app to published for other tests
    await App.findByIdAndUpdate(testAppId, { status: 'PUBLISHED' });

    // ==============================================================
    // 5. SECURITY REVIEW CENTER
    // ==============================================================
    console.log('\n--- 5. Testing Security Review Center Decisions ---');

    let secReport = await SecurityReport.findOne({ version: testVersion._id });
    if (!secReport) {
      secReport = await SecurityReport.create({
        app: testAppId,
        version: testVersion._id,
        status: 'SUSPICIOUS',
        overallRiskScore: 65,
        riskLevel: 'HIGH',
        findings: [{ severity: 'HIGH', category: 'PERMISSIONS', description: 'Suspicious combinations' }],
        signatureTrust: { isTrusted: true, status: 'VALID' }
      });
    }

    const secReviewRes = await fetch(`${API_URL}/admin/security/reports/${secReport._id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        decision: 'APPROVED',
        reason: 'Manual static and sandbox inspection verified permissions are benign for core audio functionality.'
      })
    });
    const secReviewData = await secReviewRes.json();
    assert(secReviewData.success, 'Security reviewer decision recorded successfully with audit trace');

    // ==============================================================
    // 6. DEVELOPER MANAGEMENT & SUSPENSION
    // ==============================================================
    console.log('\n--- 6. Testing Developer Management & Account Suspension ---');

    // 6.1 List Developers
    const devListRes = await fetch(`${API_URL}/admin/developers?limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const devListData = await devListRes.json();
    assert(devListData.success && Array.isArray(devListData.data?.developers), 'Admin fetched developer directory');

    // 6.2 Suspend Developer
    const suspendRes = await fetch(`${API_URL}/admin/developers/${developerId}/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        reason: 'Multiple policy violations under investigation.',
        duration: 'TEMPORARY',
        days: 7
      })
    });
    const suspendData = await suspendRes.json();
    assert(
      suspendData.success && suspendData.data?.developer?.accountStatus === 'SUSPENDED',
      'Developer account successfully suspended'
    );

    // 6.3 Suspended Developer Attempting Application Creation Blocked
    const blockedCreateRes = await fetch(`${API_URL}/developer/apps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`
      },
      body: JSON.stringify({
        name: 'Should Be Blocked App',
        description: 'Testing that suspended developers cannot create applications',
        category: 'TOOLS'
      })
    });
    assert(blockedCreateRes.status === 403, 'Suspended developer rejected with 403 ACCOUNT_SUSPENDED');

    // 6.4 Restore Developer
    const restoreRes = await fetch(`${API_URL}/admin/developers/${developerId}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        reason: 'Investigation concluded. Developer provided compliance proof.'
      })
    });
    const restoreData = await restoreRes.json();
    assert(
      restoreData.success && restoreData.data?.developer?.accountStatus === 'ACTIVE',
      'Developer account restored to ACTIVE status'
    );

    // ==============================================================
    // 7. SUBSCRIPTIONS & QUOTA ENFORCEMENT
    // ==============================================================
    console.log('\n--- 7. Testing Subscriptions & App Quota Limits ---');

    // 7.1 Seed / Get Plans
    const plansRes = await fetch(`${API_URL}/admin/subscriptions/plans`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const plansData = await plansRes.json();
    assert(
      plansData.success && plansData.data?.plans?.length >= 4,
      'Subscription plans retrieved (Free, Silver, Gold, Diamond)'
    );

    // 7.2 Developer Quota Check via Service
    const quotaCheck = await SubscriptionLimitService.canCreateApplication(developerId);
    assert(quotaCheck.allowed !== undefined, `Quota check succeeded: allowed=${quotaCheck.allowed} (${quotaCheck.currentPeriodAppCount}/${quotaCheck.appLimit})`);

    // 7.3 Admin Manually Updates Developer Subscription
    const silverPlan = plansData.data.plans.find((p) => p.slug === 'silver');
    const updateSubRes = await fetch(`${API_URL}/admin/subscriptions/${developerId}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        planId: silverPlan._id,
        status: 'ACTIVE',
        monthsToAdd: 3,
        reason: 'Promotional grant for active beta contributor'
      })
    });
    const updateSubData = await updateSubRes.json();
    assert(
      updateSubData.success && updateSubData.data?.subscription?.status === 'ACTIVE',
      'Admin manually upgraded developer subscription to Silver Tier with audit logging'
    );

    // ==============================================================
    // 8. PAYMENT MANAGEMENT & MANUAL QR VERIFICATION
    // ==============================================================
    console.log('\n--- 8. Testing Payment Management & Manual QR Verification ---');

    // Create a pending test payment
    const testPayment = await Payment.create({
      paymentId: 'PAY_' + Date.now(),
      developer: developerId,
      plan: silverPlan._id,
      amount: 399,
      currency: 'INR',
      paymentMethod: 'MANUAL_QR',
      status: 'PENDING',
      paymentReference: 'UTR9876543210',
      transactionId: 'TXN_' + Date.now()
    });

    const verifyPayRes = await fetch(`${API_URL}/admin/payments/${testPayment._id}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        decision: 'APPROVED',
        reason: 'Bank statement verified matching UTR with transaction amount.'
      })
    });
    const verifyPayData = await verifyPayRes.json();
    assert(
      verifyPayData.success && verifyPayData.data?.payment?.status === 'SUCCESS',
      'Manual QR payment approved -> Status set to SUCCESS and subscription activated'
    );

    // ==============================================================
    // 9. SUPPORT TICKETING & MESSAGING
    // ==============================================================
    console.log('\n--- 9. Testing Support Helpdesk & Threaded Messaging ---');

    // Create a support ticket
    const ticket = await SupportTicket.create({
      ticketNumber: 'TICK-' + Date.now().toString().slice(-6),
      createdBy: developerId,
      userType: 'DEVELOPER',
      subject: 'Assistance with SDK integration',
      description: 'Need clarification on Play Asset Delivery requirements.',
      category: 'TECHNICAL',
      priority: 'MEDIUM',
      status: 'OPEN'
    });

    // Admin views ticket
    const ticketRes = await fetch(`${API_URL}/admin/support/${ticket._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const ticketData = await ticketRes.json();
    assert(ticketData.success && ticketData.data?.ticket?._id === ticket._id.toString(), 'Admin accessed support ticket details');

    // Admin replies to ticket
    const replyRes = await fetch(`${API_URL}/admin/support/${ticket._id}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        message: 'Hello! AppOrbit supports APK expansion and split APK bundles. Please check our developer documentation.'
      })
    });
    const replyData = await replyRes.json();
    assert(replyData.success && replyData.data?.message?.message?.includes('AppOrbit supports'), 'Admin replied to ticket');

    // Admin updates ticket status to RESOLVED
    const statusRes = await fetch(`${API_URL}/admin/support/${ticket._id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'RESOLVED' })
    });
    const statusData = await statusRes.json();
    assert(statusData.success && statusData.data?.ticket?.status === 'RESOLVED', 'Ticket status changed to RESOLVED');

    // ==============================================================
    // 10. COMMUNITY REPORTS & MODERATION
    // ==============================================================
    console.log('\n--- 10. Testing Platform Reports & Resolution ---');

    const testReport = await PlatformReport.create({
      targetType: 'APP',
      targetId: testAppId,
      reporter: normalUser._id,
      category: 'BROKEN_DOWNLOAD',
      description: 'Download button fails to load on older Android version',
      status: 'OPEN'
    });

    const resolveRepRes = await fetch(`${API_URL}/admin/reports/${testReport._id}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        resolution: 'Verified storage CDN edge node resolved network timeout issue.'
      })
    });
    const resolveRepData = await resolveRepRes.json();
    assert(
      resolveRepData.success && resolveRepData.data?.report?.status === 'RESOLVED',
      'Report successfully investigated and marked RESOLVED'
    );

    // ==============================================================
    // 11. IMMUTABLE FORENSIC AUDIT LOGS
    // ==============================================================
    console.log('\n--- 11. Verifying Append-Only Audit Logging Integrity ---');

    const auditRes = await fetch(`${API_URL}/admin/audit-logs?limit=20`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const auditData = await auditRes.json();
    assert(auditData.success && Array.isArray(auditData.data?.logs), 'Admin queried forensic audit logs');

    const actionsLogged = auditData.data.logs.map((l) => l.action);
    const hasAppBlocked = actionsLogged.includes('APP_BLOCKED');
    const hasDevSuspended = actionsLogged.includes('DEVELOPER_SUSPENDED');
    const hasPaymentVerified = actionsLogged.includes('PAYMENT_VERIFIED');
    assert(
      hasAppBlocked && hasDevSuspended && hasPaymentVerified,
      `Audit ledger recorded sensitive administrative actions: APP_BLOCKED, DEVELOPER_SUSPENDED, PAYMENT_VERIFIED`
    );

    // ==============================================================
    // 12. PLATFORM SETTINGS & MAINTENANCE MODE
    // ==============================================================
    console.log('\n--- 12. Testing Platform Settings & Maintenance Mode ---');

    const getSettingsRes = await fetch(`${API_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const getSettingsData = await getSettingsRes.json();
    assert(getSettingsData.success && getSettingsData.data?.settings?.general, 'Admin retrieved platform settings');

    // 12.1 Toggle Maintenance Mode ON
    const maintOnRes = await fetch(`${API_URL}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        ...getSettingsData.data.settings,
        maintenance: {
          isEnabled: true,
          message: 'Scheduled infrastructure maintenance in progress.',
          bypassAdmins: true
        },
        reason: 'Testing maintenance mode lock for public traffic'
      })
    });
    const maintOnData = await maintOnRes.json();
    assert(maintOnData.success && maintOnData.data?.settings?.maintenance?.enabled === true, 'Maintenance mode enabled');

    // 12.2 Verify Public Route returns 503
    const publicMaintRes = await fetch(`${API_URL}/apps`);
    assert(
      publicMaintRes.status === 503,
      'Public endpoint /api/apps correctly returns 503 Service Unavailable during maintenance mode'
    );

    // 12.3 Verify Admin Route STILL works (Bypass)
    const adminMaintRes = await fetch(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminMaintRes.status === 200,
      'Admin endpoints remain fully accessible (200 OK) with administrator bypass'
    );

    // 12.4 Toggle Maintenance Mode OFF
    await fetch(`${API_URL}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        ...maintOnData.data.settings,
        maintenance: {
          isEnabled: false,
          message: '',
          bypassAdmins: true
        },
        reason: 'Maintenance test completed. Public access restored.'
      })
    });

    const publicRestoredRes = await fetch(`${API_URL}/apps`);
    assert(publicRestoredRes.status === 200, 'Public endpoint /api/apps restored to normal operation (200 OK)');

    // ==============================================================
    // SUMMARY
    // ==============================================================
    console.log('\n===============================================================');
    console.log(`Phase 7 Test Suite Finished: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal Test Execution Error:', err);
    process.exit(1);
  }
}

runTests();
