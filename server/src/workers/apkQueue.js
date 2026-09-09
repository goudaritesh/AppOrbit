import { ApkProcessingService } from '../services/apk/apkProcessingService.js';

/**
 * APK Processing Queue Manager
 * Dual-driver architecture: robust in-process queue by default for standalone environments,
 * with BullMQ / Redis support for distributed enterprise clusters.
 */
class ApkQueue {
  constructor() {
    this.driver = process.env.APK_QUEUE_DRIVER || 'memory';
    this.queue = [];
    this.isProcessing = false;
    this.concurrency = 2;
    this.activeWorkers = 0;
  }

  /**
   * Enqueue an APK processing job
   */
  async addJob({ versionId, priority = 'normal' }) {
    if (!versionId) {
      throw new Error('versionId is required to schedule APK processing job');
    }

    if (this.driver === 'memory') {
      this.queue.push({ versionId, queuedAt: Date.now() });
      // Non-blocking tick trigger
      setImmediate(() => this._processNext());
      return { id: `job-${versionId}`, status: 'queued' };
    }

    // BullMQ Driver (when configured with REDIS_URL)
    if (this.driver === 'redis' && process.env.REDIS_URL) {
      try {
        const { Queue } = await import('bullmq');
        const bullQueue = new Queue('apk-processing', {
          connection: { url: process.env.REDIS_URL },
        });
        const job = await bullQueue.add('process-apk', { versionId }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        });
        return { id: job.id, status: 'queued' };
      } catch (err) {
        console.warn('[ApkQueue] Redis connection failed, falling back to memory queue:', err.message);
        this.queue.push({ versionId, queuedAt: Date.now() });
        setImmediate(() => this._processNext());
        return { id: `job-${versionId}`, status: 'queued' };
      }
    }

    // Default fallback
    this.queue.push({ versionId, queuedAt: Date.now() });
    setImmediate(() => this._processNext());
    return { id: `job-${versionId}`, status: 'queued' };
  }

  /**
   * Process in-memory queue items with concurrency throttle
   */
  async _processNext() {
    if (this.activeWorkers >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.activeWorkers++;

    try {
      await ApkProcessingService.processVersion(job.versionId);
    } catch (err) {
      console.error(`[ApkQueue] Job execution failed for version ${job.versionId}:`, err);
    } finally {
      this.activeWorkers--;
      // Continue draining queue
      if (this.queue.length > 0) {
        setImmediate(() => this._processNext());
      }
    }
  }

  /**
   * Direct synchronous execution (primarily for integration tests)
   */
  async processDirect(versionId) {
    return await ApkProcessingService.processVersion(versionId);
  }
}

export const apkQueue = new ApkQueue();
export default apkQueue;
