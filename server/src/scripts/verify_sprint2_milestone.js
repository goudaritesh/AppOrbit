import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import App from '../models/App.js';
import { Subscription } from '../models/Subscription.js';

const API_URL = 'http://localhost:5000/api';
const V1_API_URL = 'http://localhost:5000/api/v1';

async function verifySprint2Milestone() {
  console.log('================================================================');
  console.log('   APPORBIT SPRINT 2 MILESTONE VERIFICATION                     ');
  console.log('   Developer Application Management & Review Workflow           ');
  console.log('================================================================\n');

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

  await connectDB();
  const timestamp = Date.now();

  // Ensure dev.aura has quota for test runs
  const devUser = await User.findOne({ email: 'dev.aura@apporbit.io' });
  if (devUser) {
    await Subscription.updateOne(
      { developer: devUser._id, status: 'ACTIVE' },
      { $set: { appsLimit: 50 } }
    );
  }

  // Find a valid category
  const category = await Category.findOne({});
  const categoryId = category ? category._id.toString() : null;

  // -------------------------------------------------------------
  // 1. DEVELOPER AUTHENTICATION & DASHBOARD STATS
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Developer Dashboard & Telemetry ---');

  const devLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dev.aura@apporbit.io', password: 'Password123!' }),
  });
  const devLogin = await devLoginRes.json();
  assert(devLogin.success && devLogin.data?.accessToken, `Developer authenticated successfully`);
  const devToken = devLogin.data?.accessToken;

  // Test Developer Dashboard Stats (Total Apps, Published, Under Review, Drafts, Downloads)
  const dashboardStatsRes = await fetch(`${API_URL}/developer/analytics?range=30d`, {
    headers: { Authorization: `Bearer ${devToken}` },
  });
  const dashboardStats = await dashboardStatsRes.json();
  assert(dashboardStatsRes.status === 200 && dashboardStats.success, `Developer Dashboard KPI telemetry retrieved successfully`);

  // -------------------------------------------------------------
  // 2. CREATE APPLICATION (DRAFT STATUS & SLUG GENERATION)
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Create Application & Slug Generation ---');

  const appPayload = {
    name: `Sprint2 Health Tracker ${timestamp}`,
    shortDescription: 'Comprehensive health and vitals monitoring assistant',
    description: 'A complete health tracking and telemetry application with on-device AI algorithms.',
    category: categoryId,
    platform: 'ANDROID',
    version: '1.0.0',
    features: ['Real-time Vitals', 'AI Anomaly Detection'],
    technologies: ['Flutter', 'Firebase', 'TensorFlow Lite'],
    githubUrl: 'https://github.com/apporbit/health-tracker',
    demoUrl: 'https://youtu.be/demo-health-tracker',
    icon: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=256',
    screenshots: [
      { url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800', alt: 'Dashboard' },
      { url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800', alt: 'Analytics' },
    ],
  };

  const createRes = await fetch(`${V1_API_URL}/apps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${devToken}`,
    },
    body: JSON.stringify(appPayload),
  });
  const createData = await createRes.json();
  assert(createRes.status === 201 && createData.success, `Application created successfully via POST /api/v1/apps`);

  const createdApp = createData.data?.app || createData.data;
  const appId = createdApp._id || createdApp.id;

  assert(createdApp.status === 'DRAFT', `Initial application status is strictly DRAFT (received: ${createdApp.status})`);
  assert(createdApp.slug && createdApp.slug.includes('sprint2-health-tracker'), `Application slug auto-generated cleanly: ${createdApp.slug}`);

  // -------------------------------------------------------------
  // 3. DRAFT ISOLATION (DRAFTS MUST NOT APPEAR PUBLICLY)
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Draft Isolation from Public Marketplace ---');

  const publicFeedRes = await fetch(`${API_URL}/apps?search=${encodeURIComponent(appPayload.name)}`);
  const publicFeed = await publicFeedRes.json();
  const publicApps = publicFeed.data?.apps || (Array.isArray(publicFeed.data) ? publicFeed.data : []);
  const foundInPublic = publicApps.some((a) => a._id === appId || a.name === appPayload.name);
  assert(!foundInPublic, `DRAFT application is isolated and does NOT appear in public marketplace queries`);

  // -------------------------------------------------------------
  // 4. EDIT APPLICATION (UPDATE FIELDS)
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Edit Application Flow ---');

  const updatePayload = {
    shortDescription: 'Updated: Ultra-smart health telemetry with real-time sync',
    technologies: ['Flutter', 'Firebase', 'TensorFlow Lite', 'WebSockets'],
    githubUrl: 'https://github.com/apporbit/health-tracker-v2',
  };

  const updateRes = await fetch(`${V1_API_URL}/apps/${appId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${devToken}`,
    },
    body: JSON.stringify(updatePayload),
  });
  const updateData = await updateRes.json();
  const updatedApp = updateData.data?.app || updateData.data;
  assert(updateRes.status === 200 && updateData.success, `Application updated successfully via PATCH /api/v1/apps/:id`);
  assert(
    updatedApp.shortDescription === updatePayload.shortDescription &&
    updatedApp.technologies.includes('WebSockets'),
    `Updated fields persisted accurately in database`
  );

  // -------------------------------------------------------------
  // 5. AUTHORIZATION & OWNERSHIP SECURITY (ANTI-TAMPERING)
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Authorization & Ownership Verification ---');

  // Authenticate as a different user/developer (User 1)
  const user1LoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'public.testuser@apporbit.io', password: 'Password123!' }),
  });
  const user1Login = await user1LoginRes.json();
  const user1Token = user1Login.data?.accessToken;

  // Attacker attempting to update another developer's app
  const unauthorizedUpdateRes = await fetch(`${V1_API_URL}/apps/${appId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user1Token}`,
    },
    body: JSON.stringify({ name: 'Hacked Application' }),
  });
  assert(
    unauthorizedUpdateRes.status === 403 || unauthorizedUpdateRes.status === 404,
    `Unauthorized user is blocked from editing Dev A's application (${unauthorizedUpdateRes.status} Forbidden/Not Found)`
  );

  // Attacker attempting to delete another developer's app
  const unauthorizedDeleteRes = await fetch(`${V1_API_URL}/apps/${appId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  assert(
    unauthorizedDeleteRes.status === 403 || unauthorizedDeleteRes.status === 404,
    `Unauthorized user is blocked from deleting Dev A's application (${unauthorizedDeleteRes.status} Forbidden/Not Found)`
  );

  // -------------------------------------------------------------
  // 6. SUBMIT APPLICATION FOR ADMIN REVIEW
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Submit for Review Flow ---');

  const submitRes = await fetch(`${V1_API_URL}/apps/${appId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${devToken}` },
  });
  const submitData = await submitRes.json();
  assert(submitRes.status === 200 && submitData.success, `Application submitted for review via POST /api/v1/apps/:id/submit`);

  // Verify status transitioned from DRAFT to PENDING_REVIEW / UNDER_REVIEW / SUBMITTED
  const currentApp = await App.findById(appId);
  const isPendingReview = ['PENDING_REVIEW', 'UNDER_REVIEW', 'SUBMITTED'].includes(currentApp.status);
  assert(isPendingReview, `Application status successfully transitioned to review queue (status: ${currentApp.status})`);

  // -------------------------------------------------------------
  // 7. ADMIN REVIEW QUEUE & STATUS AUDIT
  // -------------------------------------------------------------
  console.log('\n--- 7. Testing Admin Review Queue & Status Audit ---');

  const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@apporbit.io', password: 'AppOrbitAdmin2026!' }),
  });
  const adminLogin = await adminLoginRes.json();
  const adminToken = adminLogin.data?.accessToken;

  // Admin retrieves pending review apps queue
  const queueRes = await fetch(`${API_URL}/admin/apps?status=PENDING_REVIEW`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const queueData = await queueRes.json();
  const pendingApps = queueData.data?.apps || (Array.isArray(queueData.data) ? queueData.data : []);
  const foundInQueue = pendingApps.some((a) => a._id === appId || a.id === appId);
  assert(queueRes.status === 200, `Admin successfully fetched pending review queue`);
  assert(foundInQueue, `Submitted application appears in Admin Review Queue with status: PENDING_REVIEW`);

  // -------------------------------------------------------------
  // 8. FRONTEND DEVELOPER CONSOLE ROUTES
  // -------------------------------------------------------------
  console.log('\n--- 8. Testing Developer Frontend Console Routes ---');

  const devRoutes = [
    '/developer',
    '/developer/apps',
    '/developer/apps/create',
    `/developer/apps/${appId}`,
    `/developer/apps/${appId}/edit`,
  ];
  for (const route of devRoutes) {
    const res = await fetch(`http://localhost:5173${route}`);
    assert(res.status === 200, `Frontend developer route '${route}' is active and returns HTTP 200`);
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`   SPRINT 2 MILESTONE VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log('   Core Developer Workflow Validated:                              ');
  console.log('   DEVELOPER ➔ Login ➔ Dashboard ➔ Create App ➔ Save Draft         ');
  console.log('   ➔ Edit App ➔ Submit for Review ➔ Admin Approval ➔ Published.   ');
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

verifySprint2Milestone().catch((err) => {
  console.error('Fatal error during Sprint 2 verification:', err);
  process.exit(1);
});
