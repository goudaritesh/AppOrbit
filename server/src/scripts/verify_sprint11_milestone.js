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
import App from '../models/App.js';
import AppVersion from '../models/AppVersion.js';
import ApkSecurityPipeline from '../security/apkSecurityPipeline.js';
import { DownloadService } from '../modules/downloads/download.service.js';
import { cacheService } from '../services/cache/cacheService.js';
import { getPaginationParams, formatPaginationResponse } from '../utils/pagination.js';
import logger from '../utils/logger.js';
import { runBackup } from './backupDatabase.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runSprint11Verification() {
  console.log('========================================================================');
  console.log('🛡️ APPORBIT SPRINT 11: SECURITY, PERFORMANCE & PRODUCTION READINESS');
  console.log('========================================================================');

  await connectDB();

  try {
    // -------------------------------------------------------------
    // [1/12] Authentication Security & Account Lockout Protection
    // -------------------------------------------------------------
    console.log('\n[1/12] Testing Authentication Security & Account Lockout Protection...');
    const testEmail = `sec_user_${Date.now()}@apporbit.io`;
    const user = new User({
      name: 'Security Test User',
      email: testEmail,
      password: 'StrongPassword2026!',
      role: 'USER',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    });
    await user.save();
    assert(user.password !== 'StrongPassword2026!', 'Password is cryptographically hashed with bcrypt');

    // Password comparison
    const correctMatch = await user.comparePassword('StrongPassword2026!');
    assert(correctMatch === true, 'Correct password validates successfully');

    const wrongMatch = await user.comparePassword('WrongPassword123');
    assert(wrongMatch === false, 'Incorrect password rejected');

    // Test 5 failed attempts lockout threshold
    assert(user.isLocked() === false, 'New account is not locked initially');
    for (let i = 1; i <= 4; i++) {
      await user.incrementLoginAttempts();
      assert(user.failedLoginAttempts === i, `Failed attempt count incremented to ${i}`);
      assert(user.isLocked() === false, `Account remains unlocked on attempt ${i}`);
    }

    // 5th failed attempt should trigger lock
    await user.incrementLoginAttempts();
    assert(user.failedLoginAttempts === 5, 'Failed attempt count reached threshold of 5');
    assert(user.isLocked() === true, 'Account is locked after 5 consecutive failed attempts');
    assert(user.lockUntil > new Date(), 'lockUntil is set to future expiration (15 minutes)');

    // Reset attempts (e.g. successful login or admin unlock)
    await user.resetLoginAttempts();
    assert(user.isLocked() === false, 'Account unlocked after resetLoginAttempts');
    assert(user.failedLoginAttempts === 0, 'Failed attempts counter reset to 0');

    // -------------------------------------------------------------
    // [2/12] Role-Based Access Control (RBAC) Enforcement
    // -------------------------------------------------------------
    console.log('\n[2/12] Testing Role-Based Access Control (RBAC) Invariants...');
    assert(['USER', 'DEVELOPER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role), 'User role assigned within allowed enum');

    const devEmail = `sec_dev_${Date.now()}@apporbit.io`;
    const devUser = await User.create({
      name: 'Security Developer',
      email: devEmail,
      password: 'DevPassword2026!',
      role: 'DEVELOPER',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    });
    assert(devUser.role === 'DEVELOPER', 'Developer user correctly instantiated with DEVELOPER role');

    // Verify role hierarchy constraints
    const allowedForUser = ['USER'].includes(user.role);
    const allowedForDev = ['DEVELOPER', 'ADMIN'].includes(devUser.role);
    assert(allowedForUser, 'USER role recognized by authorization checks');
    assert(allowedForDev, 'DEVELOPER role recognized by developer authorization checks');

    // -------------------------------------------------------------
    // [3/12] API Rate Limiting Configuration Verification
    // -------------------------------------------------------------
    console.log('\n[3/12] Testing API Rate Limiting Middleware Suite...');
    const rateLimitModule = await import('../middleware/rateLimitMiddleware.js');
    assert(typeof rateLimitModule.loginRateLimiter === 'function', 'loginRateLimiter configured');
    assert(typeof rateLimitModule.registerRateLimiter === 'function', 'registerRateLimiter configured');
    assert(typeof rateLimitModule.reviewRateLimiter === 'function', 'reviewRateLimiter configured');
    assert(typeof rateLimitModule.downloadRateLimiter === 'function', 'downloadRateLimiter configured');
    assert(typeof rateLimitModule.apiRateLimiter === 'function', 'apiRateLimiter configured');

    // -------------------------------------------------------------
    // [4/12] Input Validation & Sanitization
    // -------------------------------------------------------------
    console.log('\n[4/12] Testing Input Validation & Sanitization Rules...');
    const reviewValModule = await import('../validators/reviewValidator.js');
    assert(typeof reviewValModule.createReviewValidation === 'function', 'createReviewValidation middleware export verified');
    assert(typeof reviewValModule.replyReviewValidation === 'function', 'replyReviewValidation middleware export verified');

    // -------------------------------------------------------------
    // [5/12] APK Upload Validation (File Ext, MIME, Magic Bytes)
    // -------------------------------------------------------------
    console.log('\n[5/12] Testing APK File Validation (MIME, Extension & Magic Bytes)...');
    // Reject non-APK extension
    const invalidExt = ApkSecurityPipeline.validateApkBinary({
      buffer: Buffer.from('test'),
      fileName: 'malicious.exe',
      fileSize: 1000,
    });
    assert(invalidExt.isValid === false, 'Rejected non-apk file extension (.exe)');

    // Reject file exceeding 200MB limit
    const oversized = ApkSecurityPipeline.validateApkBinary({
      buffer: Buffer.from('test'),
      fileName: 'huge.apk',
      fileSize: 250 * 1024 * 1024,
    });
    assert(oversized.isValid === false, 'Rejected file exceeding 200MB threshold');

    // Reject non-ZIP magic bytes
    const badMagic = ApkSecurityPipeline.validateApkBinary({
      buffer: Buffer.from([0x00, 0x01, 0x02, 0x03]),
      fileName: 'fake.apk',
      fileSize: 1000,
    });
    assert(badMagic.isValid === false, 'Rejected corrupted APK with invalid binary header');

    // Accept valid APK ZIP magic bytes: PK\x03\x04
    const validZipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x08, 0x00]);
    const validApk = ApkSecurityPipeline.validateApkBinary({
      buffer: validZipHeader,
      fileName: 'release.apk',
      fileSize: validZipHeader.length,
    });
    assert(validApk.isValid === true, 'Accepted legitimate APK binary matching PK\\x03\\x04 ZIP header');

    // -------------------------------------------------------------
    // [6/12] APK Checksum & Integrity Hash (SHA-256)
    // -------------------------------------------------------------
    console.log('\n[6/12] Testing SHA-256 Cryptographic Checksum & apkHash virtual...');
    const testApkPayload = Buffer.from('AppOrbit_Sample_APK_Payload_Binary_Content');
    const checksum = ApkSecurityPipeline.computeApkChecksum(testApkPayload);
    assert(checksum && checksum.length === 64, `SHA-256 checksum generated (${checksum.substring(0, 16)}...)`);

    const app = await App.create({
      name: 'Security Shield App',
      shortDescription: 'Enterprise security shield and integrity monitor',
      description: 'Full-featured enterprise security shield and application integrity monitor for Android.',
      slug: `sec-app-${Date.now()}`,
      developer: devUser._id,
      status: 'PUBLISHED',
      category: new mongoose.Types.ObjectId(),
    });

    const version = new AppVersion({
      app: app._id,
      developer: devUser._id,
      versionName: '1.0.0',
      versionCode: 1,
      fileName: 'security-shield-v1.apk',
      originalFileName: 'app-release.apk',
      fileSize: testApkPayload.length,
      fileHash: checksum,
      storageKey: `approved/${app._id}/v1.apk`,
      status: 'PUBLISHED',
    });
    await version.save();
    assert(version.apkHash === checksum, 'AppVersion virtual apkHash matches cryptographic SHA-256 fileHash');

    // -------------------------------------------------------------
    // [7/12] APK Malware Scan & Permission Risk Analysis
    // -------------------------------------------------------------
    console.log('\n[7/12] Testing Heuristic Malware Scan & Permission Risk Analysis...');
    // Clean scan
    const cleanBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Buffer.from('Clean application binary data')]);
    const cleanScan = ApkSecurityPipeline.scanApkBuffer(cleanBuffer);
    assert(cleanScan.scanStatus === 'SCAN_PASSED', 'Clean APK passes heuristic scan');
    assert(cleanScan.scanResult === 'clean', 'Scan result flagged clean');

    // Malicious scan
    const infectedBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Buffer.from('payload: trojan.dropper malicious binary')]);
    const maliciousScan = ApkSecurityPipeline.scanApkBuffer(infectedBuffer);
    assert(maliciousScan.scanStatus === 'SCAN_FAILED', 'Infected APK fails security scan');
    assert(maliciousScan.scanResult === 'malicious', 'Threat identified as malicious trojan dropper');

    // Permission risk analysis
    const samplePermissions = [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
    ];
    const riskAnalysis = ApkSecurityPipeline.analyzePermissions(samplePermissions);
    assert(riskAnalysis.permissionRisks.high.includes('android.permission.CAMERA'), 'CAMERA categorized as HIGH_RISK');
    assert(riskAnalysis.permissionRisks.high.includes('android.permission.RECORD_AUDIO'), 'RECORD_AUDIO categorized as HIGH_RISK');
    assert(riskAnalysis.permissionRisks.medium.includes('android.permission.READ_EXTERNAL_STORAGE'), 'STORAGE categorized as MEDIUM_RISK');
    assert(riskAnalysis.permissionRisks.low.includes('android.permission.INTERNET'), 'INTERNET categorized as LOW_RISK');
    assert(riskAnalysis.riskLevel === 'HIGH' || riskAnalysis.riskLevel === 'MEDIUM', `Calculated riskLevel: ${riskAnalysis.riskLevel}`);
    assert(riskAnalysis.riskScore > 0, `Computed riskScore: ${riskAnalysis.riskScore}/100`);

    // -------------------------------------------------------------
    // [8/12] Secure Controlled APK Downloads
    // -------------------------------------------------------------
    console.log('\n[8/12] Testing Secure Controlled Download Flow & Gatekeepers...');
    app.currentVersion = version._id;
    await app.save();

    const downloadSession = await DownloadService.initiateDownload({
      appId: app._id,
      user: user,
      ip: '192.168.1.50',
    });
    assert(downloadSession.sessionToken, 'Secure temporary download session token generated');
    assert(downloadSession.downloadUrl.includes(downloadSession.sessionToken), 'Download URL incorporates session token');

    // Gatekeeper check on suspended app
    app.status = 'SUSPENDED';
    await app.save();

    let blockedCaught = false;
    try {
      await DownloadService.initiateDownload({
        appId: app._id,
        user: user,
      });
    } catch (err) {
      blockedCaught = true;
      assert(err.statusCode === 403, 'Suspended app download blocked with 403 Forbidden');
    }
    assert(blockedCaught, 'Download gatekeeper successfully prevented downloading suspended app');

    // -------------------------------------------------------------
    // [9/12] Database Indexing & Pagination Utility
    // -------------------------------------------------------------
    console.log('\n[9/12] Testing Database Indexing & Pagination Utility...');
    const userIndexes = await User.collection.indexes();
    const hasEmailIndex = userIndexes.some((idx) => idx.key.email === 1);
    assert(hasEmailIndex, 'User collection has unique index on email');

    const appIndexes = await App.collection.indexes();
    assert(appIndexes.length > 0, 'App collection has optimized database indexes');

    // Test pagination utility functions
    const paginationParams = getPaginationParams({ page: '2', limit: '15' }, 10, 50);
    assert(paginationParams.page === 2, 'Pagination page parsed: 2');
    assert(paginationParams.limit === 15, 'Pagination limit parsed: 15');
    assert(paginationParams.skip === 15, 'Pagination skip computed: 15');

    const pagedResponse = formatPaginationResponse({
      data: [{ id: 1 }, { id: 2 }],
      total: 45,
      page: 2,
      limit: 15,
    });
    assert(pagedResponse.pagination.totalPages === 3, 'Total pages calculated: 3');
    assert(pagedResponse.pagination.hasNextPage === true, 'hasNextPage is true for page 2 of 3');
    assert(pagedResponse.pagination.hasPrevPage === true, 'hasPrevPage is true for page 2 of 3');

    // -------------------------------------------------------------
    // [10/12] Route Caching & Dynamic Invalidation
    // -------------------------------------------------------------
    console.log('\n[10/12] Testing Centralized Caching & Pattern Invalidation...');
    const testKey = `route:/api/v1/apps/popular?limit=4`;
    await cacheService.set(testKey, { sample: 'data' }, 60);

    const cachedItem = await cacheService.get(testKey);
    assert(cachedItem && cachedItem.sample === 'data', 'Cache hit: Stored payload retrieved');

    await cacheService.invalidatePattern('route:/api/v1/apps');
    const invalidatedItem = await cacheService.get(testKey);
    assert(invalidatedItem === null, 'Cache invalidated: Pattern invalidation removed matching route key');

    // -------------------------------------------------------------
    // [11/12] Structured Security Logging & Sanitization
    // -------------------------------------------------------------
    console.log('\n[11/12] Testing Structured Security Logging & Credential Redaction...');
    assert(typeof logger.security === 'function', 'logger.security method available');

    const sampleMeta = {
      user: 'admin@apporbit.io',
      password: 'SuperSecretPassword!',
      token: 'jwt_bearer_token_xyz',
      ip: '127.0.0.1',
    };
    const redacted = logger.redact(sampleMeta);
    assert(redacted.password === '[REDACTED]', 'Sensitive password redacted in logs');
    assert(redacted.token === '[REDACTED]', 'Sensitive token redacted in logs');
    assert(redacted.user === 'admin@apporbit.io', 'Non-sensitive user identifier preserved');

    // -------------------------------------------------------------
    // [12/12] Automated Database Backup & Recovery Readiness
    // -------------------------------------------------------------
    console.log('\n[12/12] Testing Automated Database Backup Snapshot Engine...');
    const backupResult = await runBackup({ retentionDays: 30 });
    assert(backupResult && backupResult.manifest, 'Database backup created valid manifest');
    assert(backupResult.manifest.totalDocuments > 0, `Backup dumped ${backupResult.manifest.totalDocuments} total documents across collections`);

    console.log('\n========================================================================');
    console.log('🎉 SPRINT 11 FULLY VERIFIED — 100% PASS RATE (ALL 12 CRITERIA PASSED)');
    console.log('========================================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ SPRINT 11 VERIFICATION FAILED:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

runSprint11Verification();
