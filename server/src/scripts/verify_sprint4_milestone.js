import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import App from '../models/App.js';
import AppVersion from '../models/AppVersion.js';
import AppReport from '../models/AppReport.js';
import { Subscription } from '../models/Subscription.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const BASE_URL = process.env.SERVER_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/v1`;

console.log('================================================================');
console.log('   APPORBIT — SPRINT 4 MILESTONE VERIFICATION');
console.log('   APK Security & Trust System Verification Suite');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failedTests++;
  }
}

/**
 * Creates a valid ZIP/APK archive with AndroidManifest.xml and dex
 */
function createValidApkArchive() {
  const zip = new AdmZip();
  zip.addFile(
    'AndroidManifest.xml',
    Buffer.from(
      '<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.apporbit.sprint4secure" android:versionCode="1" android:versionName="1.0.0"><uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34"/><application android:label="Sprint4SecurityApp"/></manifest>'
    )
  );
  zip.addFile('classes.dex', Buffer.from('DEX\n035\0security_verified_dex_bytecode'));
  zip.addFile('resources.arsc', Buffer.from('compiled_binary_resources_chunk'));
  zip.addFile(
    'META-INF/CERT.RSA',
    Buffer.from('APPORBIT_SIGNED_CERTIFICATE_TEST_FIXTURE_KEY_ALGORITHM_SHA256_WITH_RSA')
  );
  return zip.toBuffer();
}

async function runSprint4Verification() {
  try {
    // 0. Connect to DB and ensure developer quota
    await connectDB();
    const devUser = await User.findOne({ email: 'dev.aura@apporbit.io' });
    if (devUser) {
      await Subscription.updateOne(
        { developer: devUser._id, status: 'ACTIVE' },
        { $set: { appsLimit: 50 } }
      );
    }

    const categoryDoc = await Category.findOne({});
    const categoryId = categoryDoc?._id?.toString();

    // 1. Authenticate Developer
    console.log('--- 1. Authenticate Developer & Admin ---');
    const devLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dev.aura@apporbit.io',
        password: 'Password123!',
      }),
    });
    const devLoginData = await devLoginRes.json();
    const devToken = devLoginData?.data?.accessToken || devLoginData?.accessToken;
    assert(Boolean(devToken), 'Developer authenticated successfully with JWT access token');

    const devHeaders = {
      Authorization: `Bearer ${devToken}`,
    };

    // Authenticate Admin
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@apporbit.io',
        password: 'AppOrbitAdmin2026!',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData?.data?.accessToken || adminLoginData?.accessToken;
    assert(Boolean(adminToken), 'Administrator authenticated successfully with admin privileges');

    const adminHeaders = {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    };

    // 2. Create Test Application
    console.log('\n--- 2. Create Developer Application ---');
    const createRes = await fetch(`${API_URL}/apps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...devHeaders,
      },
      body: JSON.stringify({
        name: `Sprint 4 Security App ${Date.now().toString().slice(-4)}`,
        shortDescription: 'App created to verify quarantine, SHA-256 integrity, and security pipeline',
        description: 'Rigorous end-to-end security test suite covering quarantine, static malware scanning, temporary download URLs, and suspension.',
        category: categoryId,
        platform: 'ANDROID',
        version: '1.0.0',
      }),
    });
    const createData = await createRes.json();
    const testApp = createData?.data?.app || createData?.app || createData?.data;
    const appId = testApp?._id || testApp?.id;
    assert(Boolean(appId), `Created test application with ID: ${appId}`);

    // 3. Developer Uploads APK (Enters Quarantine)
    console.log('\n--- 3. Upload APK into Isolated Quarantine ---');
    const apkBuffer = createValidApkArchive();
    const apkForm = new FormData();
    apkForm.append('apk', new Blob([apkBuffer], { type: 'application/vnd.android.package-archive' }), 'pulseguard-v1.0.0.apk');
    apkForm.append('versionName', '1.0.0');
    apkForm.append('versionCode', '10');
    apkForm.append('releaseNotes', 'Sprint 4 Initial secure build with cryptographic signature.');

    const uploadRes = await fetch(`${API_URL}/apps/${appId}/apk`, {
      method: 'POST',
      headers: devHeaders,
      body: apkForm,
    });
    const uploadData = await uploadRes.json();

    assert(uploadRes.status === 200 || uploadRes.status === 201, `APK upload succeeded with HTTP ${uploadRes.status}`);
    const apkVersionId = uploadData?.data?._id || uploadData?.data?.id || uploadData?._id;
    assert(Boolean(apkVersionId), `Created AppVersion record: ${apkVersionId}`);

    // Verify DB Version & Quarantine invariants
    const appVersionDoc = await AppVersion.findById(apkVersionId);
    assert(Boolean(appVersionDoc), 'Found AppVersion document in database');
    assert(Boolean(appVersionDoc?.sha256), `Generated SHA-256 hash: ${appVersionDoc?.sha256}`);
    assert(appVersionDoc?.downloadStatus === 'DISABLED', `Initial downloadStatus is DISABLED: ${appVersionDoc?.downloadStatus}`);

    const quarantineValidStatuses = ['QUARANTINED', 'PENDING_SCAN', 'SCANNING', 'PASSED'];
    assert(
      quarantineValidStatuses.includes(appVersionDoc?.securityStatus),
      `securityStatus is in quarantine lifecycle: ${appVersionDoc?.securityStatus}`
    );

    // 4. Invariant: Unscanned / Quarantined APK != Public Download
    console.log('\n--- 4. Invariant Check: Unapproved / Quarantined APK != Public Download ---');
    const prematureDownloadRes = await fetch(`${API_URL}/apps/${appId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert(
      prematureDownloadRes.status === 403 || prematureDownloadRes.status === 400,
      `Premature download request rejected with HTTP ${prematureDownloadRes.status}`
    );
    const prematureData = await prematureDownloadRes.json();
    assert(
      prematureData?.success === false,
      `Public download blocked prior to publication: ${prematureData?.message}`
    );

    // 5. Public Security Status Endpoint
    console.log('\n--- 5. Verify Public Security Status Endpoint ---');
    const publicSecRes = await fetch(`${API_URL}/apps/${appId}/security`);
    assert(publicSecRes.status === 200, 'GET /api/v1/apps/:id/security returned HTTP 200');
    const publicSecData = await publicSecRes.json();
    assert(publicSecData?.success === true, 'Public security response success flag is true');
    assert(Boolean(publicSecData?.data?.version?.sha256), `Public security exposes SHA-256 hash: ${publicSecData?.data?.version?.sha256}`);
    assert(Array.isArray(publicSecData?.data?.checks), 'Public security provides configured verification checks array');
    assert(
      publicSecData?.data?.disclaimer?.includes('does not guarantee'),
      'Transparent disclaimer displayed without false 100% safe promises'
    );

    // 6. Admin Security Report Endpoint
    console.log('\n--- 6. Admin Security Report & Inspection ---');
    const adminSecRes = await fetch(`${API_URL}/admin/apps/${appId}/security`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminSecRes.status === 200, 'GET /api/v1/admin/apps/:id/security returned HTTP 200');
    const adminSecData = await adminSecRes.json();
    assert(adminSecData?.success === true, 'Admin security report success flag is true');
    assert(
      adminSecData?.data?.securityReport?.threatsDetected === 0,
      `Configured security scan reports 0 threats detected: ${adminSecData?.data?.securityReport?.threatsDetected}`
    );
    assert(
      Boolean(adminSecData?.data?.signature?.verified),
      'APK signature verified during security pipeline analysis'
    );

    // 7. Admin Approval & Quarantine Transition to Approved
    console.log('\n--- 7. Admin Approves APK & Publishes Application ---');
    const approveRes = await fetch(`${API_URL}/admin/apps/${appId}/approve`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ reviewNotes: 'Passed all static security and signature checks.' }),
    });
    assert(approveRes.status === 200, 'PATCH /api/v1/admin/apps/:id/approve returned HTTP 200');
    const approveData = await approveRes.json();
    assert(approveData?.success === true, 'Admin approval success flag is true');

    const updatedAppDoc = await App.findById(appId);
    assert(updatedAppDoc.status === 'PUBLISHED', `App status transitioned to PUBLISHED: ${updatedAppDoc.status}`);

    const updatedVersionDoc = await AppVersion.findById(apkVersionId);
    assert(updatedVersionDoc.securityStatus === 'APPROVED', `Version securityStatus is APPROVED: ${updatedVersionDoc.securityStatus}`);
    assert(updatedVersionDoc.downloadStatus === 'ENABLED', `Version downloadStatus is ENABLED: ${updatedVersionDoc.downloadStatus}`);

    // 8. Secure Temporary Download Access
    console.log('\n--- 8. Generate 5-Minute Temporary Signed Download Access ---');
    const downloadRes = await fetch(`${API_URL}/apps/${appId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert(downloadRes.status === 200, 'POST /api/v1/apps/:id/download returned HTTP 200');
    const downloadData = await downloadRes.json();
    assert(downloadData?.success === true, 'Secure download token generated successfully');
    assert(
      Boolean(downloadData?.data?.downloadUrl),
      `Secure temporary download endpoint issued: ${downloadData?.data?.downloadUrl}`
    );
    assert(
      downloadData?.data?.expiresIn === 300,
      `Download access token TTL set to exactly 300 seconds (5 mins): ${downloadData?.data?.expiresIn}`
    );

    // 9. User Application Safety Reporting
    console.log('\n--- 9. User Application Safety Reporting System ---');
    const reportRes = await fetch(`${API_URL}/apps/${appId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${devToken}`,
      },
      body: JSON.stringify({
        reason: 'POSSIBLE_MALWARE',
        description: 'Test community report flag for suspicious memory behavior.',
      }),
    });
    assert(reportRes.status === 201, 'POST /api/v1/apps/:id/report returned HTTP 201');
    const reportData = await reportRes.json();
    assert(reportData?.success === true, 'Report saved successfully');
    assert(reportData?.data?.status === 'OPEN', `Report status initialized to OPEN: ${reportData?.data?.status}`);

    const savedReport = await AppReport.findById(reportData?.data?.id);
    assert(Boolean(savedReport), 'AppReport saved into MongoDB collection');

    // 10. Admin Emergency App Suspension
    console.log('\n--- 10. Admin Emergency App Suspension & Download Invalidation ---');
    const suspendRes = await fetch(`${API_URL}/admin/apps/${appId}/suspend`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ reason: 'Investigating community safety report.' }),
    });
    assert(suspendRes.status === 200, 'PATCH /api/v1/admin/apps/:id/suspend returned HTTP 200');

    // Try downloading suspended app
    const postSuspendDownloadRes = await fetch(`${API_URL}/apps/${appId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert(
      postSuspendDownloadRes.status === 403,
      `Download request on suspended app strictly blocked with HTTP 403: ${postSuspendDownloadRes.status}`
    );
    const postSuspendData = await postSuspendDownloadRes.json();
    assert(
      postSuspendData?.code === 'APP_SUSPENDED',
      `Error code correctly identifies APP_SUSPENDED: ${postSuspendData?.code}`
    );

    // SUMMARY
    console.log('\n================================================================');
    console.log(`   SPRINT 4 VERIFICATION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('================================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('\nVerification run threw an unexpected error:', error);
    process.exit(1);
  }
}

runSprint4Verification();
