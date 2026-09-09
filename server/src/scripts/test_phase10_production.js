import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { validateEnv } from '../config/envValidator.js';
import { runBackup } from './backupDatabase.js';
import { runRestore } from './restoreDatabase.js';

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;
const V1_API_URL = `${BASE_URL}/api/v1`;

async function runPhase10Tests() {
  console.log('========================================================================');
  console.log('   APPORBIT — PHASE 10 PRODUCTION HARNESS & AUDIT SUITE                 ');
  console.log('   DevOps, Health, Caching, Security Headers, Tracing & Resiliency      ');
  console.log('========================================================================\n');

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

  // -------------------------------------------------------------------------
  // SECTION 1: Environment Invariant Validation Tests
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 1: Environment Configuration & Validation ---');

  // Test 1.1: validateEnv on valid configuration
  try {
    const validMockEnv = {
      NODE_ENV: 'development',
      PORT: '5000',
      MONGODB_URI: 'mongodb://localhost:27017/apporbit',
      JWT_SECRET: 'super-secure-jwt-secret-at-least-32-chars-long-1234567890',
      JWT_REFRESH_SECRET: 'super-secure-jwt-refresh-secret-at-least-32-chars-long-1234567890',
    };
    const validated = validateEnv(validMockEnv, { throwOnError: true, exitOnError: false });
    assert(validated.PORT === 5000 && validated.NODE_ENV === 'development', 'validateEnv validates development configuration and casts types');
  } catch (err) {
    assert(false, `validateEnv failed on valid config: ${err.message}`);
  }

  // Test 1.2: validateEnv throws on missing critical keys
  try {
    const invalidMockEnv = {
      NODE_ENV: 'production',
      PORT: '5000',
      // Missing MONGODB_URI and JWT_SECRET
    };
    validateEnv(invalidMockEnv, { throwOnError: true, exitOnError: false });
    assert(false, 'validateEnv should have thrown on missing critical production keys');
  } catch (err) {
    assert(err.message.includes('MONGODB_URI') || err.message.includes('JWT_SECRET'), 'validateEnv throws descriptive error when critical keys are missing');
  }

  // -------------------------------------------------------------------------
  // SECTION 2: Health Check Endpoints
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 2: Subsystem Health Check Endpoints ---');

  try {
    // Test 2.1: Basic /health endpoint
    const resHealth = await fetch(`${BASE_URL}/health`);
    const dataHealth = await resHealth.json();
    assert(resHealth.status === 200 && dataHealth.status === 'ok', `GET /health returns 200 OK with status: 'ok' (${resHealth.status})`);

    // Test 2.2: Liveness probe /health/live
    const resLive = await fetch(`${BASE_URL}/health/live`);
    const dataLive = await resLive.json();
    assert(resLive.status === 200 && (dataLive.status === 'alive' || dataLive.status === 'live'), `GET /health/live returns process status: 'live' (${resLive.status})`);

    // Test 2.3: Readiness probe /health/ready
    const resReady = await fetch(`${BASE_URL}/health/ready`);
    const dataReady = await resReady.json();
    assert(
      resReady.status === 200 &&
      dataReady.status === 'ready' &&
      dataReady.checks.database.status === 'connected' &&
      (dataReady.checks.cache.status === 'ready' || dataReady.checks.cache.status === 'connected'),
      `GET /health/ready confirms MongoDB connected and Cache ready`
    );

    // Test 2.4: Mounted API health routes /api/health and /api/v1/health
    const resApiHealth = await fetch(`${API_URL}/health`);
    assert(resApiHealth.status === 200, `GET /api/health responds with 200`);

    const resV1Health = await fetch(`${V1_API_URL}/health/ready`);
    assert(resV1Health.status === 200, `GET /api/v1/health/ready responds with 200`);
  } catch (err) {
    assert(false, `Health check tests failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 3: Security Headers & Correlation IDs
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 3: Security Headers & Request Tracing ---');

  try {
    const customReqId = 'req_test_suite_trace_9999';
    const resSec = await fetch(`${BASE_URL}/health`, {
      headers: { 'x-request-id': customReqId },
    });

    const returnedReqId = resSec.headers.get('x-request-id');
    const xContentType = resSec.headers.get('x-content-type-options');
    const xFrame = resSec.headers.get('x-frame-options');
    const csp = resSec.headers.get('content-security-policy');

    assert(returnedReqId === customReqId, `Request Correlation ID preserved: ${returnedReqId}`);
    assert(xContentType === 'nosniff', `X-Content-Type-Options is nosniff: ${xContentType}`);
    assert(xFrame === 'SAMEORIGIN', `X-Frame-Options is SAMEORIGIN: ${xFrame}`);
    assert(csp !== null && csp.length > 0, `Content-Security-Policy header is configured and enforced`);
  } catch (err) {
    assert(false, `Security header tests failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 4: NoSQL Injection & Input Sanitization
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 4: NoSQL Operator Sanitization ---');

  try {
    // Send a query with $gt operator
    const resSanitize = await fetch(`${API_URL}/search?q[$gt]=`, {
      headers: { 'Accept': 'application/json' }
    });
    // Regardless of result, the request must not crash the query engine with mongo operator injection
    assert(resSanitize.status === 200 || resSanitize.status === 400, `API safely handles and scrubs NoSQL injection operators ($gt) without 500 crashes (${resSanitize.status})`);
  } catch (err) {
    assert(false, `NoSQL sanitization test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 5: Standardized Error Handling
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 5: Production Error Handler Standardization ---');

  try {
    const res404 = await fetch(`${API_URL}/non-existent-endpoint-phase10-audit`);
    const data404 = await res404.json();

    assert(res404.status === 404, `Non-existent route returns 404 (${res404.status})`);
    assert(data404.success === false, `Error response has success: false`);
    assert(typeof data404.code === 'string', `Error response includes standard code: ${data404.code}`);
    assert(
      process.env.NODE_ENV === 'production' ? data404.stack === undefined : true,
      `Stack trace handling conforms to environment mode (Current: ${process.env.NODE_ENV || 'development'})`
    );
    assert(data404.requestId !== undefined, `Correlation requestId included in error payload: ${data404.requestId}`);
  } catch (err) {
    assert(false, `Standardized error handling test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 6: High-Performance Caching Layer
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 6: Resilient Caching Layer (HIT / MISS) ---');

  try {
    // Request 1: Cache MISS
    const resCache1 = await fetch(`${API_URL}/apps/popular`);
    const cacheHeader1 = resCache1.headers.get('x-cache');

    // Request 2: Cache HIT
    const resCache2 = await fetch(`${API_URL}/apps/popular`);
    const cacheHeader2 = resCache2.headers.get('x-cache');

    assert(cacheHeader1 === 'MISS' || cacheHeader1 === 'HIT', `First request cache header received: ${cacheHeader1}`);
    assert(cacheHeader2 === 'HIT', `Second immediate request resulted in Cache HIT: ${cacheHeader2}`);
  } catch (err) {
    assert(false, `Caching layer test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 7: API Versioning Aliases (/api/v1)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 7: API Versioning Compatibility (/api/v1) ---');

  try {
    const resLegacy = await fetch(`${API_URL}/apps/popular`);
    const resV1 = await fetch(`${V1_API_URL}/apps/popular`);

    const dataLegacy = await resLegacy.json();
    const dataV1 = await resV1.json();

    assert(resLegacy.status === 200 && resV1.status === 200, `Both /api and /api/v1 routes return 200 OK`);
    assert(dataLegacy.success === true && dataV1.success === true, `Both /api and /api/v1 return matching success structure`);
    assert(dataLegacy.data.length === dataV1.data.length, `Both /api and /api/v1 deliver identical dataset length (${dataV1.data.length} apps)`);
  } catch (err) {
    assert(false, `API versioning test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 8: Database Backup & Restore Automated Verification
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 8: Automated Database Backup & Disaster Recovery ---');

  try {
    // Create an automated backup
    const backupResult = await runBackup();
    assert(backupResult.targetDir && fs.existsSync(backupResult.targetDir), `Automated database backup created successfully in ${backupResult.targetDir}`);
    assert(backupResult.manifest.totalDocuments > 0, `Backup manifest verified: ${backupResult.manifest.totalDocuments} records dumped across collections`);

    // Verify restore in dry-run mode
    const restoreResult = await runRestore({ backupFolder: backupResult.targetDir, dryRun: true });
    assert(restoreResult.dryRun === true && restoreResult.restoredTotal > 0, `Disaster recovery dry-run verified ${restoreResult.restoredTotal} records successfully without mutation`);
  } catch (err) {
    assert(false, `Database backup and disaster recovery test failed: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`   PHASE 10 AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase10Tests().catch((err) => {
  console.error('Fatal error during Phase 10 test execution:', err);
  process.exit(1);
});
