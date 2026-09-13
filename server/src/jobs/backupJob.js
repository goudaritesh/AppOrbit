import { runBackup } from '../scripts/backupDatabase.js';
import logger from '../utils/logger.js';

/**
 * Automated Database Backup Job (Sprint 11 Priority 7)
 * Runs scheduled snapshots of database collections with manifest tracking
 * and automatic 30-day retention pruning.
 */
export async function runBackupJob({ retentionDays = 30 } = {}) {
  try {
    logger.info('[BackupJob] Starting automated database backup...');
    const result = await runBackup({ retentionDays });
    logger.info('[BackupJob] Database backup completed successfully', {
      targetDir: result?.targetDir,
      totalDocuments: result?.totalDocuments,
    });
    return result;
  } catch (err) {
    logger.error('[BackupJob] Database backup failed:', { error: err.message });
    throw err;
  }
}

export default {
  runBackupJob,
};
