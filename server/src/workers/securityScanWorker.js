import { SecurityReportService } from '../services/security/securityReportService.js';
import { securityScanQueue } from './securityScanQueue.js';

/**
 * Security Scan Worker Process
 * Can be run in standalone worker containers or imported into the core application process.
 */
export const startSecurityScanWorker = async () => {
  if (process.env.SECURITY_QUEUE_DRIVER === 'redis' && process.env.REDIS_URL) {
    try {
      const { Worker } = await import('bullmq');
      const worker = new Worker(
        'apk-security-scan',
        async (job) => {
          return await SecurityReportService.runSecurityScan(job.data.versionId, job.data.options);
        },
        {
          connection: { url: process.env.REDIS_URL },
          concurrency: 2,
        }
      );

      worker.on('completed', (job) => {
        console.log(`[SecurityWorker] Job ${job.id} completed for version ${job.data.versionId}`);
      });

      worker.on('failed', (job, err) => {
        console.error(`[SecurityWorker] Job ${job?.id} failed:`, err);
      });

      return worker;
    } catch (err) {
      console.warn('[SecurityWorker] Redis worker failed to start, using in-process queue:', err.message);
    }
  }

  // In-process memory worker is initialized with queue
  return securityScanQueue;
};

export default startSecurityScanWorker;
