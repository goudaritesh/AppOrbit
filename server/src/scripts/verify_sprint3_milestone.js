import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import { Subscription } from '../models/Subscription.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const BASE_URL = process.env.SERVER_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api/v1`;

console.log('================================================================');
console.log('   APPORBIT — SPRINT 3 MILESTONE VERIFICATION');
console.log('   App Media & APK Upload System Test Suite');
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
 * Creates a minimal valid 1x1 PNG buffer with valid magic bytes
 */
function createValidPngBuffer() {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR header
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);
}

/**
 * Creates a fake executable with PE header disguised with .png extension
 */
function createFakeExeDisguisedAsImage() {
  return Buffer.from([
    0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, // MZ header (Windows EXE)
    0x04, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00,
  ]);
}

/**
 * Creates a minimal valid MP4 buffer with ftyp header at byte 4
 */
function createValidMp4Buffer() {
  const buf = Buffer.alloc(32);
  buf.writeUInt32BE(0x00000020, 0); // box length
  buf.write('ftyp', 4, 'ascii'); // major brand
  buf.write('isom', 8, 'ascii');
  buf.writeUInt32BE(0x00000200, 12);
  buf.write('mp41', 16, 'ascii');
  return buf;
}

/**
 * Creates a valid ZIP/APK archive with AndroidManifest.xml
 */
function createValidApkArchive() {
  const zip = new AdmZip();
  zip.addFile(
    'AndroidManifest.xml',
    Buffer.from('<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.apporbit.sprint3test" android:versionCode="1" android:versionName="1.0.0"><uses-sdk android:minSdkVersion="21" android:targetSdkVersion="34"/><application android:label="Sprint3Test"/></manifest>')
  );
  zip.addFile('classes.dex', Buffer.from('DEX\n035\0dummy_dex_data'));
  zip.addFile('resources.arsc', Buffer.from('dummy_resources'));
  return zip.toBuffer();
}

async function runSprint3Verification() {
  try {
    // 0. Ensure Database Connection and Quotas
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

    console.log('--- 1. Authenticate Developer ---');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dev.aura@apporbit.io',
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    const devToken = loginData?.data?.accessToken || loginData?.accessToken;
    assert(Boolean(devToken), 'Developer authenticated and received JWT access token');

    const authHeaders = {
      Authorization: `Bearer ${devToken}`,
    };

    console.log('\n--- 2. Fetch Category & Create Test App ---');
    assert(Boolean(categoryId), `Retrieved valid category ID: ${categoryId}`);

    const createRes = await fetch(`${API_URL}/apps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        name: `Sprint 3 Media App ${Date.now().toString().slice(-4)}`,
        shortDescription: 'App created for Sprint 3 Media & APK upload verification',
        description: 'Comprehensive test suite verifying icons, screenshots, videos, and APK storage.',
        category: categoryId,
        platform: 'ANDROID',
        version: '1.0.0',
        technologies: ['Kotlin', 'Compose', 'Jetpack'],
        features: ['Real-time ECG', 'Cloud sync'],
      }),
    });

    const createData = await createRes.json();
    const testApp = createData?.data?.app || createData?.app || createData?.data;
    const appId = testApp?._id || testApp?.id;
    assert(Boolean(appId), `Created test application with ID: ${appId}`);

    console.log('\n--- 3. Direct App Icon Upload from Computer (Valid PNG) ---');
    const iconBuffer = createValidPngBuffer();
    const iconForm = new FormData();
    iconForm.append('icon', new Blob([iconBuffer], { type: 'image/png' }), 'app-icon.png');

    const iconRes = await fetch(`${API_URL}/apps/${appId}/icon`, {
      method: 'POST',
      headers: authHeaders,
      body: iconForm,
    });
    const iconData = await iconRes.json();

    assert(iconRes.status === 200, 'POST /api/v1/apps/:id/icon returned HTTP 200');
    assert(Boolean(iconData?.icon), `App icon URL saved: ${iconData?.icon}`);
    assert(
      iconData?.icon?.startsWith('/uploads/app-icons/'),
      'App icon stored in isolated /uploads/app-icons/ path'
    );

    console.log('\n--- 4. Reject Disguised Executable with .png Extension ---');
    const fakeExe = createFakeExeDisguisedAsImage();
    const fakeForm = new FormData();
    fakeForm.append('icon', new Blob([fakeExe], { type: 'image/png' }), 'virus.png');

    const fakeRes = await fetch(`${API_URL}/apps/${appId}/icon`, {
      method: 'POST',
      headers: authHeaders,
      body: fakeForm,
    });
    const fakeData = await fakeRes.json();

    assert(
      fakeRes.status === 400,
      `Malicious file rejected with HTTP 400: ${fakeData?.message}`
    );
    assert(
      fakeData?.code === 'MAGIC_BYTES_MISMATCH',
      `Error code matches MAGIC_BYTES_MISMATCH: ${fakeData?.code}`
    );

    console.log('\n--- 5. Upload Application Screenshots (Multiple Files) ---');
    const shot1 = createValidPngBuffer();
    const shot2 = createValidPngBuffer();
    const shotsForm = new FormData();
    shotsForm.append('screenshots', new Blob([shot1], { type: 'image/png' }), 'screen1.png');
    shotsForm.append('screenshots', new Blob([shot2], { type: 'image/png' }), 'screen2.png');

    const shotsRes = await fetch(`${API_URL}/apps/${appId}/screenshots`, {
      method: 'POST',
      headers: authHeaders,
      body: shotsForm,
    });
    const shotsData = await shotsRes.json();

    assert(shotsRes.status === 201, 'POST /api/v1/apps/:id/screenshots returned HTTP 201');
    assert(shotsData?.screenshots?.length === 2, `Uploaded 2 screenshots: count=${shotsData?.screenshots?.length}`);
    const firstShotId = shotsData?.screenshots?.[0]?._id;
    assert(Boolean(firstShotId), `Screenshot assigned unique subdocument ID: ${firstShotId}`);

    console.log('\n--- 6. Delete a Screenshot by ID ---');
    const delShotRes = await fetch(`${API_URL}/apps/${appId}/screenshots/${firstShotId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    const delShotData = await delShotRes.json();

    assert(delShotRes.status === 200, 'DELETE /api/v1/apps/:id/screenshots/:screenshotId returned HTTP 200');
    assert(
      delShotData?.screenshots?.length === 1,
      `Screenshot successfully removed from application: remaining=${delShotData?.screenshots?.length}`
    );

    console.log('\n--- 7. Upload Demo Video (Direct MP4) ---');
    const videoBuffer = createValidMp4Buffer();
    const videoForm = new FormData();
    videoForm.append('video', new Blob([videoBuffer], { type: 'video/mp4' }), 'preview-demo.mp4');

    const videoRes = await fetch(`${API_URL}/apps/${appId}/demo-video`, {
      method: 'POST',
      headers: authHeaders,
      body: videoForm,
    });
    const videoData = await videoRes.json();

    assert(videoRes.status === 200, 'POST /api/v1/apps/:id/demo-video returned HTTP 200');
    assert(
      videoData?.demoVideo?.url?.startsWith('/uploads/demo-videos/'),
      `Demo video stored: ${videoData?.demoVideo?.url}`
    );

    console.log('\n--- 8. Upload APK Binary, Validate & Extract Metadata ---');
    const apkBuffer = createValidApkArchive();
    const apkForm = new FormData();
    apkForm.append('apk', new Blob([apkBuffer], { type: 'application/vnd.android.package-archive' }), 'PulseGuard-v1.0.0.apk');
    apkForm.append('versionName', '1.0.0');
    apkForm.append('versionCode', '1');

    const apkRes = await fetch(`${API_URL}/apps/${appId}/apk`, {
      method: 'POST',
      headers: authHeaders,
      body: apkForm,
    });
    const apkData = await apkRes.json();

    assert(apkRes.status === 201, 'POST /api/v1/apps/:id/apk returned HTTP 201');
    const apkRecord = apkData?.apk;
    assert(Boolean(apkRecord), 'Returned APK metadata record');
    assert(
      Boolean(apkRecord?.sha256 && apkRecord.sha256.length === 64),
      `Generated 64-char SHA-256 binary hash: ${apkRecord?.sha256}`
    );
    assert(
      Boolean(apkRecord?.storageKey && apkRecord.storageKey.startsWith('apks/')),
      `Stored in private storage key: ${apkRecord?.storageKey}`
    );
    assert(
      apkRecord?.size === apkBuffer.length,
      `Binary size recorded correctly: ${apkRecord?.size} bytes`
    );

    console.log('\n--- 9. App Ownership RBAC Guard ---');
    const otherUserRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'public.testuser@apporbit.io',
        password: 'Password123!',
      }),
    });
    const otherUserData = await otherUserRes.json();
    const otherToken = otherUserData?.data?.accessToken || otherUserData?.accessToken;

    const unauthorizedForm = new FormData();
    unauthorizedForm.append('icon', new Blob([iconBuffer], { type: 'image/png' }), 'hack.png');

    const unauthRes = await fetch(`${API_URL}/apps/${appId}/icon`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${otherToken}`,
      },
      body: unauthorizedForm,
    });

    assert(
      [403, 404].includes(unauthRes.status),
      `Unauthorized upload properly blocked with HTTP ${unauthRes.status}`
    );

    console.log('\n--- 10. Verify Static Serving of Uploaded Media ---');
    const iconWebUrl = `${BASE_URL}${iconData?.icon}`;
    const staticCheck = await fetch(iconWebUrl);
    assert(staticCheck.status === 200, `Static media accessible via HTTP GET: ${iconWebUrl}`);
    const staticBlob = await staticCheck.arrayBuffer();
    assert(
      staticBlob.byteLength === iconBuffer.length,
      `Served image matches uploaded byte size (${staticBlob.byteLength} bytes)`
    );

    console.log('\n================================================================');
    console.log(`   SPRINT 3 VERIFICATION SUMMARY`);
    console.log(`   Total Tests Passed: ${passedTests}`);
    console.log(`   Total Tests Failed: ${failedTests}`);
    console.log('================================================================\n');

    process.exit(failedTests > 0 ? 1 : 0);
  } catch (fatalErr) {
    console.error('[FATAL TEST ERROR]', fatalErr.message);
    process.exit(1);
  }
}

runSprint3Verification();
