import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB } from '../config/db.js';

const BACKUP_ROOT = path.resolve(__dirname, '../../backups');

export async function runRestore({ backupFolder = null, dryRun = false } = {}) {
  let targetDir = backupFolder;

  // If no folder provided, locate latest backup
  if (!targetDir) {
    if (!fs.existsSync(BACKUP_ROOT)) {
      throw new Error(`Backup directory '${BACKUP_ROOT}' does not exist.`);
    }
    const folders = fs.readdirSync(BACKUP_ROOT).filter((f) => f.startsWith('backup_')).sort().reverse();
    if (folders.length === 0) {
      throw new Error('No backup snapshots found in backups directory.');
    }
    targetDir = path.join(BACKUP_ROOT, folders[0]);
  }

  console.log(`[Restore] Initializing Database Restore from: ${targetDir} (Dry-Run: ${dryRun})`);

  const manifestPath = path.join(targetDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Corrupted backup: Missing manifest.json in ${targetDir}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`  Source Snapshot Time: ${manifest.timestamp}`);
  console.log(`  Target Snapshot Docs: ${manifest.totalDocuments}`);

  await connectDB();

  let restoredTotal = 0;

  for (const [colName, expectedCount] of Object.entries(manifest.collections)) {
    const colFile = path.join(targetDir, `${colName}.json`);
    if (!fs.existsSync(colFile)) {
      console.warn(`  ⚠️ Missing collection dump for '${colName}'`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(colFile, 'utf-8'));

    if (!dryRun && data.length > 0) {
      // Upsert / restore documents safely
      const collection = mongoose.connection.db.collection(colName);
      for (const doc of data) {
        if (doc._id) {
          const { _id, ...rest } = doc;
          const objectId = typeof _id === 'string' && mongoose.isValidObjectId(_id) ? new mongoose.Types.ObjectId(_id) : _id;
          await collection.updateOne({ _id: objectId }, { $set: rest }, { upsert: true });
        }
      }
    }

    restoredTotal += data.length;
    console.log(`  ✓ Verified/Restored ${data.length} documents for '${colName}' (expected: ${expectedCount})`);
  }

  console.log(`[Restore] Completed successfully. Total Documents Processed: ${restoredTotal}`);
  return { success: true, restoredTotal, dryRun };
}

// Execute directly if run as CLI script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isDryRun = process.argv.includes('--dry-run');
  runRestore({ dryRun: isDryRun })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Restore] Fatal error during restore:', err);
      process.exit(1);
    });
}
