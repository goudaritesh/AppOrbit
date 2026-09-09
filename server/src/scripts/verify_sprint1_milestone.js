import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function verifySprint1Milestone() {
  console.log('================================================================');
  console.log('   APPORBIT SPRINT 1 MILESTONE VERIFICATION                     ');
  console.log('   Authentication, RBAC & Role-Based Dashboard Access           ');
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

  const timestamp = Date.now();

  // -------------------------------------------------------------
  // 1. REGISTRATION ENDPOINTS (POST /api/auth/register & /signup)
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Registration Flow (USER & DEVELOPER) ---');

  const newUserData = {
    name: 'Test Sprint1 User',
    email: `testuser_${timestamp}@apporbit.io`,
    password: 'Password123!',
    role: 'USER',
  };

  const regUserRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUserData),
  });
  const regUserJson = await regUserRes.json();
  assert(regUserRes.status === 201 && regUserJson.success, `New USER registration via POST /api/auth/register succeeded`);

  const newDevData = {
    name: 'Test Sprint1 Dev',
    email: `testdev_${timestamp}@apporbit.io`,
    password: 'Password123!',
    role: 'DEVELOPER',
  };

  const regDevRes = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newDevData),
  });
  const regDevJson = await regDevRes.json();
  assert(regDevRes.status === 201 && regDevJson.success, `New DEVELOPER registration via POST /api/auth/signup succeeded`);

  // -------------------------------------------------------------
  // 2. USER ROLE AUTHENTICATION & ACCESS GATING
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing USER Role Experience ---');
  const userLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'public.testuser@apporbit.io', password: 'Password123!' }),
  });
  const userLogin = await userLoginRes.json();
  assert(userLogin.success && userLogin.data?.accessToken, `Public User logged in successfully with JWT token`);
  const userToken = userLogin.data?.accessToken;

  // USER can access personal profile
  const userProfileRes = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(userProfileRes.status === 200, `USER granted access to personal profile`);

  // USER is strictly blocked from Developer Portal
  const userDevBlockRes = await fetch(`${API_URL}/developer/apps`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(userDevBlockRes.status === 403, `USER is blocked from Developer Console (HTTP 403 Forbidden)`);

  // USER is strictly blocked from Admin Console
  const userAdminBlockRes = await fetch(`${API_URL}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert(userAdminBlockRes.status === 403, `USER is blocked from Admin Console (HTTP 403 Forbidden)`);

  // -------------------------------------------------------------
  // 3. DEVELOPER ROLE AUTHENTICATION & ACCESS GATING
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing DEVELOPER Role Experience ---');
  const devLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dev.aura@apporbit.io', password: 'Password123!' }),
  });
  const devLogin = await devLoginRes.json();
  assert(devLogin.success && devLogin.data?.accessToken, `Developer logged in successfully with JWT token`);
  const devToken = devLogin.data?.accessToken;

  // DEVELOPER is granted access to Developer Console
  const devAppsRes = await fetch(`${API_URL}/developer/apps`, {
    headers: { Authorization: `Bearer ${devToken}` },
  });
  assert(devAppsRes.status === 200, `DEVELOPER granted access to Developer Dashboard & App Management`);

  // DEVELOPER is strictly blocked from Admin Console
  const devAdminBlockRes = await fetch(`${API_URL}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${devToken}` },
  });
  assert(devAdminBlockRes.status === 403, `DEVELOPER is blocked from Admin Console (HTTP 403 Forbidden)`);

  // -------------------------------------------------------------
  // 4. ADMIN ROLE AUTHENTICATION & ACCESS GATING
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing ADMIN Role Experience ---');
  const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@apporbit.io', password: 'AppOrbitAdmin2026!' }),
  });
  const adminLogin = await adminLoginRes.json();
  assert(adminLogin.success && adminLogin.data?.accessToken, `Super Admin logged in successfully with JWT token`);
  const adminToken = adminLogin.data?.accessToken;

  // ADMIN is granted access to Admin Dashboard
  const adminDashboardRes = await fetch(`${API_URL}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminDashboardRes.status === 200, `ADMIN granted access to Admin Dashboard`);

  // ADMIN can manage platform developers
  const adminDevsRes = await fetch(`${API_URL}/admin/developers`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminDevsRes.status === 200, `ADMIN granted access to Developer Management`);

  // -------------------------------------------------------------
  // 5. FRONTEND ROUTE ACCESSIBILITY
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Frontend Route Accessibility ---');
  const routes = ['/', '/login', '/signup', '/register', '/explore', '/apps'];
  for (const route of routes) {
    const res = await fetch(`http://localhost:5173${route}`);
    assert(res.status === 200, `Frontend route '${route}' is active and returns HTTP 200`);
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`   SPRINT 1 MILESTONE VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log('   Milestone Requirement Met:                                      ');
  console.log('   "A user can register, log in, and access the correct dashboard   ');
  console.log('   based on their role (USER, DEVELOPER, ADMIN)."                  ');
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

verifySprint1Milestone().catch((err) => {
  console.error('Fatal error during Sprint 1 verification:', err);
  process.exit(1);
});
