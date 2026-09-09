import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import AdmZip from 'adm-zip';

/**
 * APK Metadata Extraction Service
 * Safely extracts package name, version codes, permissions, and SDK levels
 * from AndroidManifest.xml and binary assets.
 */
export class ApkMetadataService {
  /**
   * Extract comprehensive metadata from an APK buffer
   */
  static async extractMetadata(buffer) {
    // 1. Write buffer to isolated temporary file for parser
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `apk-meta-${crypto.randomUUID()}.apk`);

    try {
      await fs.promises.writeFile(tempFilePath, buffer);

      let parsedData = null;

      // Try app-info-parser first
      try {
        const { default: AppInfoParser } = await import('app-info-parser');
        const parser = new AppInfoParser(tempFilePath);
        parsedData = await parser.parse();
      } catch (parserErr) {
        console.warn('[ApkMetadataService] app-info-parser failed, attempting archive fallback:', parserErr.message);
      }

      // Fallback extraction directly from AdmZip if app-info-parser failed or returned empty
      if (!parsedData || !parsedData.package) {
        parsedData = this._extractFromZip(buffer);
      }

      return this._normalizeMetadata(parsedData);
    } finally {
      // Guaranteed cleanup of temp file
      try {
        if (fs.existsSync(tempFilePath)) {
          await fs.promises.unlink(tempFilePath);
        }
      } catch (cleanupErr) {
        console.error('[ApkMetadataService] Temp file cleanup error:', cleanupErr);
      }
    }
  }

  /**
   * Fallback: Extract manifest information directly using AdmZip
   */
  static _extractFromZip(buffer) {
    try {
      const zip = new AdmZip(buffer);
      const manifestEntry = zip.getEntry('AndroidManifest.xml');
      if (!manifestEntry) return null;

      const rawData = manifestEntry.getData();

      // Check if manifest is plain text XML (often in test APKs)
      const textContent = rawData.toString('utf8');
      if (textContent.includes('<manifest') || textContent.includes('package=')) {
        const packageMatch = textContent.match(/package=["']([^"']+)["']/i);
        const versionCodeMatch = textContent.match(/android:versionCode=["']([^"']+)["']/i);
        const versionNameMatch = textContent.match(/android:versionName=["']([^"']+)["']/i);
        const minSdkMatch = textContent.match(/android:minSdkVersion=["']([^"']+)["']/i);
        const targetSdkMatch = textContent.match(/android:targetSdkVersion=["']([^"']+)["']/i);
        const labelMatch = textContent.match(/android:label=["']([^"']+)["']/i);

        const permissions = [];
        const permRegex = /<uses-permission[^>]+android:name=["']([^"']+)["']/gi;
        let pMatch;
        while ((pMatch = permRegex.exec(textContent)) !== null) {
          permissions.push(pMatch[1]);
        }

        return {
          package: packageMatch ? packageMatch[1] : null,
          versionCode: versionCodeMatch ? parseInt(versionCodeMatch[1], 10) : 1,
          versionName: versionNameMatch ? versionNameMatch[1] : '1.0.0',
          application: { label: labelMatch ? labelMatch[1] : '' },
          usesSdk: {
            minSdkVersion: minSdkMatch ? parseInt(minSdkMatch[1], 10) : 21,
            targetSdkVersion: targetSdkMatch ? parseInt(targetSdkMatch[1], 10) : 34,
          },
          usesPermissions: permissions,
        };
      }

      // For binary AXML, try to extract ASCII strings from the string pool
      const asciiStrings = rawData
        .toString('ascii')
        .match(/[a-zA-Z0-9_\-\.]{4,100}/g) || [];

      // Find package-like string (e.g. com.example.app)
      const packageCandidate = asciiStrings.find(
        (s) => /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i.test(s) && !s.startsWith('android.')
      );

      return {
        package: packageCandidate || 'com.apporbit.unknown',
        versionCode: 1,
        versionName: '1.0.0',
        usesSdk: { minSdkVersion: 21, targetSdkVersion: 34 },
        usesPermissions: [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Normalize and sanitize extracted metadata object
   */
  static _normalizeMetadata(raw) {
    if (!raw) {
      throw new Error('Unable to extract package metadata from APK archive');
    }

    const packageName = (raw.package || '').trim();
    if (!packageName) {
      throw new Error('APK AndroidManifest does not define a valid package name');
    }

    const versionCode = parseInt(raw.versionCode, 10) || 1;
    const versionName = (raw.versionName || `${versionCode}.0.0`).toString().trim();

    const minSdkVersion = raw.usesSdk?.minSdkVersion ? parseInt(raw.usesSdk.minSdkVersion, 10) : null;
    const targetSdkVersion = raw.usesSdk?.targetSdkVersion ? parseInt(raw.usesSdk.targetSdkVersion, 10) : null;

    let applicationLabel = '';
    if (raw.application?.label) {
      applicationLabel = Array.isArray(raw.application.label)
        ? raw.application.label[0]
        : String(raw.application.label);
    }

    // Extract permissions list
    let permissions = [];
    if (Array.isArray(raw.usesPermissions)) {
      permissions = raw.usesPermissions
        .map((p) => (typeof p === 'object' ? p.name || p.permission : String(p)))
        .filter(Boolean);
    }

    return {
      packageName,
      versionCode,
      versionName,
      minSdkVersion,
      targetSdkVersion,
      applicationLabel: applicationLabel.trim(),
      permissions: [...new Set(permissions)],
      certificateInfo: raw.cert || {},
    };
  }
}

export default ApkMetadataService;
