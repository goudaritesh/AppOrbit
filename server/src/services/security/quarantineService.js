import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SecurityAuditLog } from '../../models/SecurityAuditLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Quarantine Service (Phase 6 Production Implementation)
 * Isolates dangerous or corrupt APK artifacts, updates containment flags,
 * and maintains immutable audit logs.
 */
export class QuarantineService {
  /**
   * Quarantine a version artifact
   * @param {Object} params
   * @param {Object} params.version - The AppVersion document
   * @param {string} params.reason - Quarantine justification
   * @param {Object} [params.actor] - Optional triggering actor
   * @returns {Promise<Object>} Quarantine confirmation
   */
  static async quarantineVersion({ version, reason, actor = { role: 'SYSTEM' } }) {
    if (!version) throw new Error('version is required to quarantine artifact');

    version.quarantined = true;
    version.quarantineReason = reason || 'Security threat or integrity violation detected';
    version.quarantinedAt = new Date();
    version.securityStatus = 'QUARANTINED';
    version.downloadStatus = 'BLOCKED';

    // Move file on local-private storage if applicable
    if (version.storageProvider === 'local-private') {
      try {
        const rawLocalRoot = process.env.STORAGE_LOCAL_PATH || 'storage/private/apks';
        const baseDir = path.isAbsolute(rawLocalRoot)
          ? rawLocalRoot
          : path.resolve(__dirname, '../../../../server', rawLocalRoot);

        const sourcePath = path.join(baseDir, version.storageKey);

        const quarantineDir = path.resolve(__dirname, '../../../../server', process.env.QUARANTINE_STORAGE_PATH || 'storage/private/quarantine');
        if (!fs.existsSync(quarantineDir)) {
          fs.mkdirSync(quarantineDir, { recursive: true });
        }

        const quarantineKey = `quarantine/${version.app}/${version._id}/${path.basename(version.storageKey)}`;
        const targetPath = path.join(quarantineDir, `${version._id}.apk`);

        if (fs.existsSync(sourcePath)) {
          await fs.promises.copyFile(sourcePath, targetPath);
          // Zero out or remove standard source to prevent accidental download
          await fs.promises.unlink(sourcePath);
          version.quarantinedStorageKey = quarantineKey;
        }
      } catch (err) {
        console.error(`[QuarantineService] Failed to physically move file for version ${version._id}:`, err);
      }
    }

    await version.save();

    // Log to Security Audit Trail
    try {
      await SecurityAuditLog.create({
        eventType: 'APK_QUARANTINED',
        version: version._id,
        app: version.app,
        developer: version.developer,
        actor,
        metadata: {
          reason,
          fileHash: version.fileHash,
          storageKey: version.storageKey,
          quarantinedAt: version.quarantinedAt,
        },
      });
    } catch (auditErr) {
      console.error('[QuarantineService] Failed to create audit record:', auditErr);
    }

    return {
      success: true,
      quarantined: true,
      versionId: version._id,
      reason,
    };
  }
}

export default QuarantineService;
