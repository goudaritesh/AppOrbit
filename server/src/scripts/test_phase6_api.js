import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import AdmZip from 'adm-zip';
import crypto from 'crypto';
import { AppVersion } from '../models/AppVersion.js';
import { App } from '../models/App.js';
import { SecurityReport } from '../models/SecurityReport.js';
import { SecurityReviewRequest } from '../models/SecurityReviewRequest.js';
import { SecurityAuditLog } from '../models/SecurityAuditLog.js';
import { storageService } from '../services/storage/storageService.js';
import { SecurityReportService } from '../services/security/securityReportService.js';
import { DownloadEligibilityService } from '../services/security/downloadEligibilityService.js';

const API_URL = 'http://localhost:5000/api';

/**
 * Creates a valid synthetic Android APK binary with manifest, dex, and signing markers
 */
function createSyntheticApk({
  packageName = 'com.apporbit.pulseguard',
  versionCode = 10,
  versionName = '2.0.0',
  permissions = ['INTERNET'],
  debuggable = false,
  signSchemes = ['v1', 'v2'],
  certSubject = 'CN=AuraHealth Labs, O=AppOrbit Dev',
  extraEntries = [],
}) {
  const zip = new AdmZip();

  // Create AndroidManifest.xml text representation
  const permTags = permissions
    .map((p) => `<uses-permission android:name="${p.startsWith('android.permission.') ? p : `android.permission.${p}`}" />`)
    .join('\n    ');

  const manifestContent = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}"
    android:versionCode="${versionCode}"
    android:versionName="${versionName}">
    <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="34" />
    ${permTags}
    <application
        android:label="PulseGuard"
        android:icon="@mipmap/ic_launcher"
        android:debuggable="${debuggable ? 'true' : 'false'}">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  zip.addFile('AndroidManifest.xml', Buffer.from(manifestContent, 'utf8'));
  zip.addFile('classes.dex', Buffer.from('dex\n035\x00synthetic_dex_bytecode_header_pulseguard', 'ascii'));

  // v1 Signing files (META-INF)
  if (signSchemes.includes('v1')) {
    zip.addFile('META-INF/MANIFEST.MF', Buffer.from('Manifest-Version: 1.0\nCreated-By: 17.0.2 (AppOrbit)\n', 'utf8'));
    zip.addFile('META-INF/CERT.SF', Buffer.from('Signature-Version: 1.0\nSHA-256-Digest-Manifest: dummy_manifest_digest\n', 'utf8'));
    zip.addFile('META-INF/CERT.RSA', Buffer.from(`\x30\x82\x02\x00${certSubject}\x00PKCS7_CERT_BYTES`, 'latin1'));
  }

  // Extra entries (e.g. native libraries)
  extraEntries.forEach((entry) => {
    zip.addFile(entry.name, entry.data || Buffer.from('mock binary', 'utf8'));
  });

  let rawBuffer = zip.toBuffer();

  // v2 APK Signing Block
  if (signSchemes.includes('v2')) {
    const sigBlock = Buffer.concat([
      Buffer.from([0x1a, 0x87, 0x09, 0x71]), // v2 ID marker
      Buffer.from(`CERT_DATA:${certSubject}`, 'utf8'),
      Buffer.from('APK Sig Block 42', 'ascii'),
    ]);
    rawBuffer = Buffer.concat([rawBuffer, sigBlock]);
  }

  return rawBuffer;
}

async function runTests() {
  console.log('--- Starting Phase 6 APK Security & Trust Verification Tests ---');
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

    // 1. Authenticate Developer A (AuraHealth Labs)
    const loginResA = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dev.aura@apporbit.io', password: 'Password123!' }),
    });
    const loginDataA = await loginResA.json();
    assert(loginDataA.success && loginDataA.data?.accessToken, 'Developer A authenticated successfully');
    const tokenA = loginDataA.data.accessToken;

    // 2. Authenticate Developer B (AquaFlow Dynamics)
    const loginResB = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dev.aquaflow@apporbit.io', password: 'Password123!' }),
    });
    const loginDataB = await loginResB.json();
    assert(loginDataB.success && loginDataB.data?.accessToken, 'Developer B authenticated successfully');
    const tokenB = loginDataB.data.accessToken;

    // 3. Authenticate Admin
    const loginResAdmin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@apporbit.io', password: 'AppOrbitAdmin2026!' }),
    });
    const loginDataAdmin = await loginResAdmin.json();
    assert(loginDataAdmin.success && loginDataAdmin.data?.accessToken, 'Admin authenticated successfully');
    const tokenAdmin = loginDataAdmin.data.accessToken;

    // 4. Retrieve PulseGuard App owned by Developer A
    const appRes = await fetch(`${API_URL}/developer/apps`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const appData = await appRes.json();
    const appA = appData.data.apps.find((a) => a.slug === 'pulseguard');
    assert(Boolean(appA), `Found Developer A owned application: ${appA?.name} (${appA?._id})`);
    const appId = appA._id;
    const developerId = appA.developer;

    // Clean up any test versions from prior test runs
    await AppVersion.deleteMany({ app: appId, versionCode: { $gte: 100 } });

    // 5. Test Clean APK Upload & Automated Security Analysis
    console.log('\n--- Scenario 1: Clean APK Inspection Pipeline ---');
    const cleanApkBuffer = createSyntheticApk({
      packageName: 'com.apporbit.pulseguard',
      versionCode: 101,
      versionName: '2.1.0',
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE', 'VIBRATE'],
      debuggable: false,
    });
    const cleanHash = crypto.createHash('sha256').update(cleanApkBuffer).digest('hex');

    // Upload multipart form to /versions/upload
    const boundary = '----WebKitFormBoundaryPhase6Test' + Date.now();
    const bodyParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="versionName"\r\n\r\n2.1.0\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="versionCode"\r\n\r\n101\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="releaseNotes"\r\n\r\nPhase 6 verified release\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="apk"; filename="pulseguard-clean.apk"\r\nContent-Type: application/vnd.android.package-archive\r\n\r\n`,
    ];
    const multipartBody = Buffer.concat([
      Buffer.from(bodyParts[0]),
      Buffer.from(bodyParts[1]),
      Buffer.from(bodyParts[2]),
      Buffer.from(bodyParts[3]),
      cleanApkBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const uploadRes = await fetch(`${API_URL}/developer/apps/${appId}/versions/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: multipartBody,
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 201 && uploadData.success, 'POST /versions/upload succeeded');
    const cleanVersionId = uploadData.data.version.id;

    // Wait for Phase 5 background apkProcessingService to complete metadata extraction
    let attempts = 0;
    while (attempts < 20) {
      const checkVer = await AppVersion.findById(cleanVersionId);
      if (checkVer && checkVer.processingStatus === 'COMPLETED') break;
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }

    // Run security scan with clean baseline key
    const scanResult = await SecurityReportService.runSecurityScan(cleanVersionId, {
      previousFingerprint: null,
    });
    assert(scanResult.success, 'Automated security scan pipeline succeeded');
    assert(scanResult.report.status === 'PASSED', `Clean APK security status is PASSED (received: ${scanResult.report.status})`);
    assert(scanResult.report.riskLevel === 'LOW', `Risk level is LOW (received: ${scanResult.report.riskLevel})`);
    assert(scanResult.report.integrityAnalysis.status === 'VALID', 'Integrity analysis is VALID');
    assert(scanResult.report.signatureInfo.signatureValid === true, 'Signature is valid');
    assert(scanResult.report.manualReviewRequired === false, 'manualReviewRequired is false for clean release');

    // 6. Developer Security Report Query API
    console.log('\n--- Scenario 2: Developer Security APIs ---');
    const getSecRes = await fetch(`${API_URL}/developer/apps/${appId}/versions/${cleanVersionId}/security`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getSecData = await getSecRes.json();
    assert(getSecRes.status === 200 && getSecData.success, 'GET /versions/:id/security returned 200 OK');
    assert(getSecData.data.security.status === 'PASSED', 'Serialized developer security status is PASSED');
    assert(getSecData.data.security.fileHash === cleanHash, 'File hash in report matches uploaded digest');
    assert(getSecData.data.security.integrity.match === true, 'Integrity match is true in developer report');
    assert(Array.isArray(getSecData.data.security.findings), 'Findings list is provided');

    // 7. Status Polling Endpoint
    const statusRes = await fetch(`${API_URL}/developer/apps/${appId}/versions/${cleanVersionId}/security/status`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const statusData = await statusRes.json();
    assert(statusRes.status === 200 && statusData.success, 'GET /versions/:id/security/status returned 200 OK');
    assert(statusData.data.isTerminal === true, 'isTerminal is true for completed scan');

    // 8. Cross-Developer Security Isolation
    console.log('\n--- Scenario 3: Security Authorization Isolation ---');
    const crossRes = await fetch(`${API_URL}/developer/apps/${appId}/versions/${cleanVersionId}/security`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(crossRes.status === 404, `Dev B accessing Dev A security report returns 404 (status: ${crossRes.status})`);

    // 9. Malware Detection & Instant Quarantine
    console.log('\n--- Scenario 4: Malware Threat Detection & Quarantine ---');
    const malwareApkBuffer = createSyntheticApk({
      packageName: 'com.apporbit.pulseguard',
      versionCode: 102,
      versionName: '2.2.0',
    });
    const malwareHash = 'bad000' + crypto.createHash('sha256').update(malwareApkBuffer).digest('hex').slice(6);

    const versionDocMalware = await AppVersion.create({
      app: appId,
      developer: developerId,
      versionName: '2.2.0',
      versionCode: 102,
      fileName: 'malware-sample.apk',
      originalFileName: 'malware-sample.apk',
      fileSize: malwareApkBuffer.length,
      fileHash: malwareHash,
      storageKey: `apks/${appId}/malware-102/app.apk`,
      storageProvider: 'local-private',
      processingStatus: 'COMPLETED',
      securityStatus: 'PENDING_SCAN',
    });

    await storageService.uploadApk({
      key: versionDocMalware.storageKey,
      buffer: malwareApkBuffer,
    });

    // Run security scan simulating malware fixture
    await SecurityReportService.runSecurityScan(versionDocMalware._id, {
      scanMetadata: { simulateMalware: true },
    });

    const updatedMalwareVer = await AppVersion.findById(versionDocMalware._id);
    assert(updatedMalwareVer.securityStatus === 'QUARANTINED' || updatedMalwareVer.securityStatus === 'MALICIOUS', `Malware version transitioned to QUARANTINED (status: ${updatedMalwareVer.securityStatus})`);
    assert(updatedMalwareVer.quarantined === true, 'version.quarantined is true');
    assert(updatedMalwareVer.downloadStatus === 'BLOCKED', 'version.downloadStatus is BLOCKED');

    // 10. Quarantined Download Gatekeeper Enforcement
    const downloadTryRes = await fetch(`${API_URL}/developer/apps/${appId}/versions/${versionDocMalware._id}/download-url`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const downloadTryData = await downloadTryRes.json();
    assert(downloadTryRes.status === 403, `Download URL generation for quarantined APK rejected with 403 Forbidden (status: ${downloadTryRes.status})`);
    assert(downloadTryData.code === 'QUARANTINED', `Rejection code is QUARANTINED (received: ${downloadTryData.code})`);

    // 11. Integrity Mismatch Detection & Quarantine
    console.log('\n--- Scenario 5: Cryptographic Integrity Digest Mismatch ---');
    const integrityTamperedBuffer = createSyntheticApk({
      packageName: 'com.apporbit.pulseguard',
      versionCode: 103,
      versionName: '2.3.0',
    });
    const fakeExpectedHash = '0000000000000000000000000000000000000000000000000000000000000000';

    const versionDocMismatch = await AppVersion.create({
      app: appId,
      developer: developerId,
      versionName: '2.3.0',
      versionCode: 103,
      fileName: 'tampered.apk',
      originalFileName: 'tampered.apk',
      fileSize: integrityTamperedBuffer.length,
      fileHash: fakeExpectedHash,
      storageKey: `apks/${appId}/tampered-103/app.apk`,
      storageProvider: 'local-private',
      processingStatus: 'COMPLETED',
      securityStatus: 'PENDING_SCAN',
    });

    await storageService.uploadApk({
      key: versionDocMismatch.storageKey,
      buffer: integrityTamperedBuffer,
    });

    await SecurityReportService.runSecurityScan(versionDocMismatch._id);

    const updatedMismatchVer = await AppVersion.findById(versionDocMismatch._id);
    assert(updatedMismatchVer.quarantined === true, 'Tampered binary quarantined');
    assert(updatedMismatchVer.integrityStatus === 'MISMATCH', `integrityStatus is MISMATCH (received: ${updatedMismatchVer.integrityStatus})`);

    // 12. Certificate Change Detection & Review Escalation
    console.log('\n--- Scenario 6: Certificate Change Detection ---');
    const certRotatedBuffer = createSyntheticApk({
      packageName: 'com.apporbit.pulseguard',
      versionCode: 104,
      versionName: '2.4.0',
      certSubject: 'CN=New Untrusted Key, O=Unknown Corp',
    });

    const versionDocCert = await AppVersion.create({
      app: appId,
      developer: developerId,
      versionName: '2.4.0',
      versionCode: 104,
      fileName: 'new-key.apk',
      originalFileName: 'new-key.apk',
      fileSize: certRotatedBuffer.length,
      fileHash: crypto.createHash('sha256').update(certRotatedBuffer).digest('hex'),
      storageKey: `apks/${appId}/cert-104/app.apk`,
      storageProvider: 'local-private',
      processingStatus: 'COMPLETED',
      securityStatus: 'PENDING_SCAN',
    });

    await storageService.uploadApk({
      key: versionDocCert.storageKey,
      buffer: certRotatedBuffer,
    });

    // Provide a different previous fingerprint to trigger detection
    await SecurityReportService.runSecurityScan(versionDocCert._id, {
      previousFingerprint: 'AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:11:22:33:44:55:66:77:88:99:00:11:22:33:44:55:66',
    });

    const updatedCertVer = await AppVersion.findById(versionDocCert._id);
    assert(updatedCertVer.securityStatus === 'PENDING_MANUAL_REVIEW', `Certificate change set status to PENDING_MANUAL_REVIEW (received: ${updatedCertVer.securityStatus})`);
    assert(updatedCertVer.manualReviewRequired === true, 'manualReviewRequired is true for certificate change');

    // 13. Dangerous Permission Combinations
    console.log('\n--- Scenario 7: Sensitive Permission Combination Analysis ---');
    const dangerPermBuffer = createSyntheticApk({
      packageName: 'com.apporbit.pulseguard',
      versionCode: 105,
      versionName: '2.5.0',
      permissions: [
        'READ_SMS',
        'SEND_SMS',
        'INTERNET',
        'BIND_ACCESSIBILITY_SERVICE',
        'SYSTEM_ALERT_WINDOW',
      ],
      debuggable: true,
    });

    const versionDocDanger = await AppVersion.create({
      app: appId,
      developer: developerId,
      versionName: '2.5.0',
      versionCode: 105,
      fileName: 'danger.apk',
      originalFileName: 'danger.apk',
      fileSize: dangerPermBuffer.length,
      fileHash: crypto.createHash('sha256').update(dangerPermBuffer).digest('hex'),
      storageKey: `apks/${appId}/danger-105/app.apk`,
      storageProvider: 'local-private',
      permissions: [
        'android.permission.READ_SMS',
        'android.permission.SEND_SMS',
        'android.permission.INTERNET',
        'android.permission.BIND_ACCESSIBILITY_SERVICE',
        'android.permission.SYSTEM_ALERT_WINDOW',
      ],
      processingStatus: 'COMPLETED',
      securityStatus: 'PENDING_SCAN',
    });

    await storageService.uploadApk({
      key: versionDocDanger.storageKey,
      buffer: dangerPermBuffer,
    });

    await SecurityReportService.runSecurityScan(versionDocDanger._id);

    const updatedDangerVer = await AppVersion.findById(versionDocDanger._id);
    const dangerReport = await SecurityReport.findOne({ version: versionDocDanger._id });
    assert(updatedDangerVer.riskScore > 50, `Risk score elevated due to dangerous permissions (score: ${updatedDangerVer.riskScore})`);
    assert(dangerReport.permissionAnalysis.dangerousCombinations.length >= 2, `Dangerous combinations detected (${dangerReport.permissionAnalysis.dangerousCombinations.length})`);
    assert(dangerReport.staticAnalysis.debuggable === true, 'Debuggable flag detected in manifest');

    // 14. Developer Manual Review Request Workflow
    console.log('\n--- Scenario 8: Manual Review Request Workflow ---');
    const reviewReqRes = await fetch(
      `${API_URL}/developer/apps/${appId}/versions/${versionDocDanger._id}/security/request-review`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Our application provides emergency automated SMS alerts for certified medical responders.',
        }),
      }
    );
    const reviewReqData = await reviewReqRes.json();
    assert(reviewReqRes.status === 201 && reviewReqData.success, 'POST /security/request-review succeeded with 201');

    // Attempting duplicate review request is rejected
    const duplicateReviewRes = await fetch(
      `${API_URL}/developer/apps/${appId}/versions/${versionDocDanger._id}/security/request-review`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Duplicate attempt to submit review request' }),
      }
    );
    assert(duplicateReviewRes.status === 400, 'Duplicate active review request rejected with 400');

    // 15. Admin Security Reports & Moderation Decisions
    console.log('\n--- Scenario 9: Admin Moderation Endpoints ---');
    const adminReportsRes = await fetch(`${API_URL}/admin/security/reports`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const adminReportsData = await adminReportsRes.json();
    assert(adminReportsRes.status === 200 && adminReportsData.success, 'GET /admin/security/reports returned 200 OK');
    assert(adminReportsData.data.reports.length > 0, `Admin report list contains records (${adminReportsData.data.reports.length})`);

    const adminReportDetailRes = await fetch(`${API_URL}/admin/security/reports/${dangerReport._id}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const adminReportDetailData = await adminReportDetailRes.json();
    assert(adminReportDetailRes.status === 200, 'GET /admin/security/reports/:id returned 200 OK');
    assert(adminReportDetailData.data.report.reviewRequests.length > 0, 'Admin report includes review requests history');

    // Admin approves the reviewed version
    const adminDecisionRes = await fetch(`${API_URL}/admin/security/reports/${dangerReport._id}/review`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenAdmin}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        decision: 'APPROVED',
        adminNotes: 'Verified legitimate medical responder enterprise credentials.',
      }),
    });
    const adminDecisionData = await adminDecisionRes.json();
    assert(adminDecisionRes.status === 200 && adminDecisionData.success, 'POST /admin/security/reports/:id/review approved version');

    const approvedVersionDoc = await AppVersion.findById(versionDocDanger._id);
    assert(approvedVersionDoc.securityStatus === 'APPROVED', `Version status updated to APPROVED (received: ${approvedVersionDoc.securityStatus})`);
    assert(approvedVersionDoc.downloadStatus === 'ENABLED', `Version downloadStatus updated to ENABLED (received: ${approvedVersionDoc.downloadStatus})`);

    // Clean up test versions
    await Promise.all([
      AppVersion.findByIdAndDelete(cleanVersionId),
      AppVersion.findByIdAndDelete(versionDocMalware._id),
      AppVersion.findByIdAndDelete(versionDocMismatch._id),
      AppVersion.findByIdAndDelete(versionDocCert._id),
      AppVersion.findByIdAndDelete(versionDocDanger._id),
      SecurityReport.deleteMany({
        version: { $in: [cleanVersionId, versionDocMalware._id, versionDocMismatch._id, versionDocCert._id, versionDocDanger._id] },
      }),
      SecurityReviewRequest.deleteMany({
        version: { $in: [cleanVersionId, versionDocMalware._id, versionDocMismatch._id, versionDocCert._id, versionDocDanger._id] },
      }),
      SecurityAuditLog.deleteMany({
        version: { $in: [cleanVersionId, versionDocMalware._id, versionDocMismatch._id, versionDocCert._id, versionDocDanger._id] },
      }),
    ]);

  } catch (err) {
    console.error('Unexpected error in test suite:', err);
    failed++;
  }

  try {
    await mongoose.connection.close();
  } catch {}

  console.log(`\n=========================================`);
  console.log(`Phase 6 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`=========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
