import 'dotenv/config';
import AdmZip from 'adm-zip';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import AppVersion from '../models/AppVersion.js';

const BASE_URL = 'http://localhost:5000/api';

const DEV_A_CREDS = {
  email: 'dev.aura@apporbit.io',
  password: 'Password123!',
};

const DEV_B_CREDS = {
  email: 'dev.aquaflow@apporbit.io',
  password: 'Password123!',
};

const USER_CREDS = {
  email: 'user.john@apporbit.io',
  password: 'Password123!',
};

const runTests = async () => {
  console.log('--- Starting Phase 5 APK Upload & Version Management API Tests ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // 1. Authenticate Developer A
    const loginResA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEV_A_CREDS),
    });
    const loginDataA = await loginResA.json();
    const tokenA = loginDataA.data?.accessToken;
    assert(loginResA.status === 200 && tokenA, 'Developer A authenticated successfully');

    // 2. Authenticate Developer B
    const loginResB = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEV_B_CREDS),
    });
    const loginDataB = await loginResB.json();
    const tokenB = loginDataB.data?.accessToken;
    assert(loginResB.status === 200 && tokenB, 'Developer B authenticated successfully');

    // 3. Get Developer A's app (PulseGuard)
    const appsResA = await fetch(`${BASE_URL}/developer/apps`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const appsDataA = await appsResA.json();
    const pulseguardApp = appsDataA.data?.apps?.find((a) => a.slug === 'pulseguard') || appsDataA.data?.apps?.[0];
    const appIdA = pulseguardApp?._id || pulseguardApp?.id;
    assert(appIdA, `Found Developer A owned application: ${pulseguardApp?.name} (${appIdA})`);

    // Connect to DB and clean up any prior test versions
    await connectDB();
    await AppVersion.deleteMany({ app: appIdA, versionCode: { $in: [1, 2] } });

    // 4. Access Control: Unauthenticated upload rejected
    const unauthRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/upload`, {
      method: 'POST',
    });
    assert(unauthRes.status === 401, 'Unauthenticated upload rejected with 401');

    // 5. Ownership: Dev B cannot initialize upload session on Dev A app
    const devBOwnershipRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/upload-init`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenB}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ originalFileName: 'test.apk' }),
    });
    assert(devBOwnershipRes.status === 404, 'Dev B initializing upload on Dev A app returns 404 (Enumeration-proof)');

    // 6. Non-APK extension rejected
    const badExtForm = new FormData();
    badExtForm.append('apk', new Blob(['fake binary content'], { type: 'application/octet-stream' }), 'trojan.exe');
    const badExtRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: badExtForm,
    });
    const badExtData = await badExtRes.json();
    assert(badExtRes.status === 400 && badExtData.message.includes('.apk'), 'Non-APK extension rejected with 400');

    // 7. Non-ZIP binary pretending to be .apk rejected
    const fakeZipForm = new FormData();
    fakeZipForm.append('apk', new Blob(['NOT_A_ZIP_HEADER_JUST_RANDOM_TEXT'], { type: 'application/vnd.android.package-archive' }), 'fake.apk');
    const fakeZipRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: fakeZipForm,
    });
    assert(fakeZipRes.status === 400, 'Non-ZIP binary pretending to be .apk rejected with 400 (Magic bytes)');

    // 8. ZIP without AndroidManifest.xml rejected
    const zipWithoutManifest = new AdmZip();
    zipWithoutManifest.addFile('readme.txt', Buffer.from('No manifest here'));
    const zipNoManifestBuffer = zipWithoutManifest.toBuffer();

    const noManifestForm = new FormData();
    noManifestForm.append('apk', new Blob([zipNoManifestBuffer], { type: 'application/vnd.android.package-archive' }), 'invalid-no-manifest.apk');
    const noManifestRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: noManifestForm,
    });
    const noManifestData = await noManifestRes.json();
    assert(noManifestRes.status === 400 && noManifestData.message.includes('AndroidManifest.xml'), 'ZIP missing AndroidManifest.xml rejected with 400');

    // 9. Build a valid minimal APK archive (build 1)
    const validApkZip1 = new AdmZip();
    const manifestXml1 = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.apporbit.pulseguard"
    android:versionCode="1"
    android:versionName="1.0.0">
    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <application android:label="PulseGuard Core" />
</manifest>`;
    validApkZip1.addFile('AndroidManifest.xml', Buffer.from(manifestXml1));
    validApkZip1.addFile('classes.dex', Buffer.from([0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00])); // Valid dex header
    const apkBuffer1 = validApkZip1.toBuffer();

    // 10. Upload Valid Version 1.0.0 (build 1)
    const uploadForm1 = new FormData();
    uploadForm1.append('apk', new Blob([apkBuffer1], { type: 'application/vnd.android.package-archive' }), 'pulseguard-v1.0.0.apk');
    uploadForm1.append('releaseNotes', 'Initial release build for beta testing');

    const uploadRes1 = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/upload?sync=true`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: uploadForm1,
    });
    const uploadData1 = await uploadRes1.json();
    assert(uploadRes1.status === 201, 'POST /versions/upload creates new APK version artifact');

    const version1 = uploadData1.data?.version;
    assert(version1?.versionCode === 1, 'Version code 1 extracted correctly');
    assert(version1?.versionName === '1.0.0', 'Version name 1.0.0 extracted correctly');
    assert(version1?.packageName === 'com.apporbit.pulseguard', 'Package name com.apporbit.pulseguard extracted correctly');
    assert(version1?.fileHash && version1.fileHash.length === 64, 'SHA-256 binary hash computed (64-char hex)');
    assert(version1?.processingStatus === 'COMPLETED', 'APK processing status is COMPLETED');
    assert(version1?.securityStatus === 'PENDING_SCAN', 'Security status defaults safely to PENDING_SCAN');
    assert(version1?.downloadStatus === 'DISABLED', 'Public download status defaults safely to DISABLED');
    assert(version1?.permissions?.includes('android.permission.INTERNET'), 'Permissions parsed from manifest');

    // 11. Duplicate versionCode rejected
    const dupForm = new FormData();
    dupForm.append('apk', new Blob([apkBuffer1], { type: 'application/vnd.android.package-archive' }), 'pulseguard-dup.apk');
    const dupRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/upload?sync=true`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: dupForm,
    });
    const dupData = await dupRes.json();
    assert(
      dupRes.status === 201 && dupData.data?.version?.processingStatus === 'FAILED' && dupData.data?.version?.processingError?.code === 'DUPLICATE_VERSION_CODE',
      'Duplicate versionCode (1) detected and marked as FAILED with DUPLICATE_VERSION_CODE'
    );
    const failedDupId = dupData.data?.version?.id;

    // 12. Cleanup the failed duplicate test version
    if (failedDupId) {
      const delDupRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/${failedDupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert(delDupRes.status === 200, 'DELETE failed duplicate version succeeds');
    }

    // 13. Package Name Consistency: Mismatched package name rejected
    const hijackApkZip = new AdmZip();
    const hijackManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.malicious.hijackapp"
    android:versionCode="2"
    android:versionName="2.0.0">
    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />
</manifest>`;
    hijackApkZip.addFile('AndroidManifest.xml', Buffer.from(hijackManifest));
    hijackApkZip.addFile('classes.dex', Buffer.from([0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00]));
    const hijackBuffer = hijackApkZip.toBuffer();

    const hijackForm = new FormData();
    hijackForm.append('apk', new Blob([hijackBuffer], { type: 'application/vnd.android.package-archive' }), 'hijack-v2.apk');
    const hijackRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/upload?sync=true`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: hijackForm,
    });
    const hijackData = await hijackRes.json();
    assert(
      hijackRes.status === 201 && hijackData.data?.version?.processingStatus === 'FAILED' && hijackData.data?.version?.processingError?.code === 'PACKAGE_NAME_MISMATCH',
      'Mismatched package name rejected and marked as FAILED with PACKAGE_NAME_MISMATCH'
    );
    const failedHijackId = hijackData.data?.version?.id;
    if (failedHijackId) {
      await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/${failedHijackId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
    }

    // 14. Upload Valid Version 2 (build 2)
    const validApkZip2 = new AdmZip();
    const manifestXml2 = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.apporbit.pulseguard"
    android:versionCode="2"
    android:versionName="1.1.0">
    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <application android:label="PulseGuard Core" />
</manifest>`;
    validApkZip2.addFile('AndroidManifest.xml', Buffer.from(manifestXml2));
    validApkZip2.addFile('classes.dex', Buffer.from([0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00]));
    const apkBuffer2 = validApkZip2.toBuffer();

    const uploadForm2 = new FormData();
    uploadForm2.append('apk', new Blob([apkBuffer2], { type: 'application/vnd.android.package-archive' }), 'pulseguard-v1.1.0.apk');
    uploadForm2.append('releaseNotes', 'Added background telemetry syncing service');

    const uploadRes2 = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/upload?sync=true`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: uploadForm2,
    });
    const uploadData2 = await uploadRes2.json();
    assert(uploadRes2.status === 201, 'Upload version 2 (build 2) succeeds');
    const version2 = uploadData2.data?.version;
    assert(version2?.versionCode === 2 && version2?.versionName === '1.1.0', 'Version 2 metadata validated');

    // 15. Set Version 2 as Current Release Candidate
    const setCurrentRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/${version2.id}/set-current`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const setCurrentData = await setCurrentRes.json();
    assert(setCurrentRes.status === 200, 'POST /set-current designates version 2 as active release candidate');
    assert(setCurrentData.data?.version?.isCurrent === true, 'version2 isCurrent is true');

    // 16. Verify version 1 isCurrent was cleared atomically
    const getV1Res = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/${version1.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getV1Data = await getV1Res.json();
    assert(getV1Data.data?.version?.isCurrent === false, 'version 1 isCurrent atomically reset to false');

    // 17. Cannot delete active current candidate
    const delCurrentRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/${version2.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(delCurrentRes.status === 400, 'Attempt to delete active current candidate rejected with 400');

    // 18. Signed Download URL Generation
    const downloadUrlRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/${version2.id}/download-url`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const downloadUrlData = await downloadUrlRes.json();
    assert(downloadUrlRes.status === 200 && downloadUrlData.data?.downloadUrl, 'GET /download-url returns signed URL');

    // 19. Streaming Download with Token
    const streamRes = await fetch(downloadUrlData.data.downloadUrl, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(streamRes.status === 200, 'Fetch signed download URL streams binary with 200 OK');
    const streamBlob = await streamRes.blob();
    assert(streamBlob.size === apkBuffer2.length, `Streamed APK size matches uploaded size (${streamBlob.size} bytes)`);

    // 20. Tampered or Expired Token Rejected
    const tamperedUrl = downloadUrlData.data.downloadUrl.replace(/token=[a-f0-9]+/, 'token=deadbeefdeadbeef');
    const tamperedRes = await fetch(tamperedUrl);
    assert(tamperedRes.status === 403, 'Tampered download token rejected with 403 Forbidden');

    // 21. Dev B cannot access Dev A version metadata or delete it
    const devBGetRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/${version2.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(devBGetRes.status === 404, 'Dev B querying Dev A version returns 404 (Enumeration-proof)');

    const devBDelRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/${version1.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(devBDelRes.status === 404, 'Dev B deleting Dev A version returns 404');

    // 22. Update Release Notes
    const patchRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/${version2.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ releaseNotes: 'Updated release notes with battery optimization notes' }),
    });
    const patchData = await patchRes.json();
    assert(
      patchRes.status === 200 && patchData.data?.version?.releaseNotes.includes('battery optimization'),
      'PATCH /versions/:id updates release notes'
    );

    // 23. Get Version History List
    const listRes = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, 'GET /versions returns 200 OK');
    assert(listData.data?.versions?.length >= 2, `Version list contains ${listData.data?.versions?.length} versions`);

    // 24. Delete non-current version 1 succeeds
    const delV1Res = await fetch(`${BASE_URL}/developer/apps/${appIdA}/versions/${version1.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(delV1Res.status === 200, 'DELETE non-current version 1 succeeds and cleans up storage');
  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    try {
      await mongoose.connection.close();
    } catch (_) {}
  }

  console.log('\n----------------------------------------------');
  console.log(` Results: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runTests();
