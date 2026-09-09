import { SecurityReportService } from '../services/security/securityReportService.js';

/**
 * Security Scan Queue Manager
 * Coordinates asynchronous APK security analysis jobs with concurrency throttling,
 * retry management, idempotency protection, and dual-driver support (in-memory or Redis/BullMQ).
 */
class SecurityScanQueue {
  constructor() {
    this.driver = process.env.SECURITY_QUEUE_DRIVER || process.env.APK_QUEUE_DRIVER || 'memory';
    this.queue = [];
    this.activeJobs = new Set();
    this.concurrency = 2;
    this.maxRetries = parseInt(process.env.SECURITY_MAX_RETRIES, 10) || 3;
    this.activeWorkers = 0;
  }

  /**
   * Enqueue an APK security scan job
   * @param {Object} params
   * @param {string} params.versionId - AppVersion ID to scan
   * @param {Object} [params.options] - Scan options / testing overrides
   * @returns {Promise<Object>} Queued job descriptor
   */
  async addJob({ versionId, options = {} }) {
    if (!versionId) {
      throw new Error('versionId is required to schedule security scan job');
    }

    // Idempotency: Prevent concurrent scans of the same version
    if (this.activeJobs.has(versionId)) {
      return { id: `sec-job-${versionId}`, status: 'already_queued' };
    }

    if (this.driver === 'redis' && process.env.REDIS_URL) {
      try {
        const { Queue } = await import('bullmq');
        const bullQueue = new Queue('apk-security-scan', {
          connection: { url: process.env.REDIS_URL },
        });
        const job = await bullQueue.add(
          'scan-apk',
          { versionId, options },
          {
            jobId: `sec-${versionId}`,
            attempts: this.maxRetries,
            backoff: { type: 'exponential', delay: 3000 },
          }
        );
        return { id: job.id, status: 'queued' };
      } catch (err) {
        console.warn('[SecurityScanQueue] Redis connection failed, falling back to memory queue:', err.message);
      }
    }

    // Memory driver
    this.activeJobs.add(versionId);
    this.queue.push({
      versionId,
      options,
      attempts: 0,
      queuedAt: Date.now(),
    });

    setImmediate(() => this._processNext());
    return { id: `sec-job-${versionId}`, status: 'queued' };
  }

  /**
   * Drain in-memory queue jobs within concurrency limit
   */
  async _processNext() {
    if (this.activeWorkers >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.activeWorkers++;

    try {
      await SecurityReportService.runSecurityScan(job.versionId, job.options);
    } catch (err) {
      console.error(`[SecurityScanQueue] Scan failed for version ${job.versionId}:`, err);
      job.attempts++;

      // Retry policy: retry transient errors if under maxRetries
      const isFatal =
        err.message?.includes('MALWARE') ||
        err.message?.includes('MISMATCH') ||
        err.message?.includes('AppVersion not found');

      if (!isFatal && job.attempts < this.maxRetries) {
        const delay = Math.pow(2, job.attempts) * 1000;
        setTimeout(() => {
          this.queue.push(job);
          this._processNext();
        }, delay);
      }
    } finally {
      this.activeJobs.delete(job.versionId);
      this.activeWorkers--;

      if (this.queue.length > 0) {
        setImmediate(() => this._processNext());
      }
    }
  }

  /**
   * Direct synchronous scan execution (used by test suites)
   */
  async processDirect(versionId, options = {}) {
    return await SecurityReportService.runSecurityScan(versionId, options);
  }
}

export const securityScanQueue = new SecurityScanQueue();
export default securityScanQueue;
