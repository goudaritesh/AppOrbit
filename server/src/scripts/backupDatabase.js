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

export async function runBackup({ retentionDays = 30 } = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const targetDir = path.join(BACKUP_ROOT, `backup_${timestamp}`);

  console.log(`[Backup] Initializing AppOrbit Database Backup to: ${targetDir}`);

  await connectDB();

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  const manifest = {
    timestamp: new Date().toISOString(),
    database: mongoose.connection.db.databaseName,
    collections: {},
    totalDocuments: 0,
  };

  for (const col of collections) {
    const colName = col.name;
    // Skip system/internal collections
    if (colName.startsWith('system.')) continue;

    const docs = await mongoose.connection.db.collection(colName).find({}).toArray();
    const filePath = path.join(targetDir, `${colName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');

    manifest.collections[colName] = docs.length;
    manifest.totalDocuments += docs.length;
    console.log(`  ✓ Dumped ${docs.length} documents from collection '${colName}'`);
  }

  // Save manifest file
  fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`[Backup] Completed successfully. Total Documents: ${manifest.totalDocuments}`);

  // Prune older backups
  try {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const existing = fs.readdirSync(BACKUP_ROOT);
    for (const folder of existing) {
      if (!folder.startsWith('backup_')) continue;
      const folderPath = path.join(BACKUP_ROOT, folder);
      const stat = fs.statSync(folderPath);
      if (stat.mtimeMs < cutoff) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        console.log(`[Backup] Pruned expired backup: ${folder}`);
      }
    }
  } catch (pruneErr) {
    console.warn(`[Backup] Notice: Backup pruning skipped: ${pruneErr.message}`);
  }

  return { targetDir, manifest };
}

// Execute directly if run as CLI script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBackup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Backup] Fatal error during backup:', err);
      process.exit(1);
    });
}
