import os from 'os';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import SystemMetric from '../models/SystemMetric.js';
import { getIO } from '../realtime/socket.js';

// In-memory error buffer (sliding window)
const recentErrors = [];
const MAX_ERROR_BUFFER = 100;

// Rolling error counters
const errorCounters = {
  apiErrors: 0,
  dbErrors: 0,
  uploadFailures: 0,
  paymentFailures: 0,
  securityScanFailures: 0,
};

// Background jobs registry status
const backgroundJobStatus = {
  dailyAnalytics: { status: 'IDLE', lastRunAt: null, durationMs: 0 },
  revenueAnalytics: { status: 'IDLE', lastRunAt: null, durationMs: 0 },
  cleanup: { status: 'IDLE', lastRunAt: null, durationMs: 0 },
  healthCheck: { status: 'HEALTHY', lastRunAt: new Date(), durationMs: 0 },
};

export class MonitoringService {
  /**
   * Captures an operational error into the central error monitoring pool.
   *
   * @param {Error|string} error - The caught exception or error message
   * @param {Object} context - Metadata detailing route, user, action, category
   */
  static captureError(error, context = {}) {
    const timestamp = new Date();
    const message = error?.message || String(error);
    const stack = error?.stack || '';
    const category = context.category || this.categorizeError(error, context);

    // Increment category counter
    switch (category) {
      case 'DATABASE_ERROR':
        errorCounters.dbErrors++;
        break;
      case 'UPLOAD_FAILURE':
        errorCounters.uploadFailures++;
        break;
      case 'PAYMENT_FAILURE':
        errorCounters.paymentFailures++;
        break;
      case 'SECURITY_SCAN_FAILURE':
        errorCounters.securityScanFailures++;
        break;
      case 'API_ERROR':
      default:
        errorCounters.apiErrors++;
        break;
    }

    const errorRecord = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp,
      message,
      category,
      path: context.path || '',
      method: context.method || '',
      statusCode: context.statusCode || error?.statusCode || 500,
      user: context.userId || null,
      stack: stack.split('\n').slice(0, 3).join('\n'), // Short stack
    };

    recentErrors.unshift(errorRecord);
    if (recentErrors.length > MAX_ERROR_BUFFER) {
      recentErrors.pop();
    }

    return errorRecord;
  }

  /**
   * Automatically classifies error category from message/context.
   */
  static categorizeError(error, context = {}) {
    const msg = (error?.message || '').toLowerCase();
    if (context.category) return context.category;
    if (msg.includes('mongo') || msg.includes('db') || msg.includes('cast to objectid') || msg.includes('validation')) {
      return 'DATABASE_ERROR';
    }
    if (msg.includes('multer') || msg.includes('upload') || msg.includes('apk') || msg.includes('file too large')) {
      return 'UPLOAD_FAILURE';
    }
    if (msg.includes('payment') || msg.includes('razorpay') || msg.includes('order') || msg.includes('webhook')) {
      return 'PAYMENT_FAILURE';
    }
    if (msg.includes('security') || msg.includes('signature') || msg.includes('scan') || msg.includes('virus')) {
      return 'SECURITY_SCAN_FAILURE';
    }
    return 'API_ERROR';
  }

  /**
   * Updates background job telemetry
   */
  static updateJobStatus(jobName, status, durationMs = 0) {
    if (backgroundJobStatus[jobName]) {
      backgroundJobStatus[jobName] = {
        status,
        lastRunAt: new Date(),
        durationMs,
      };
    }
  }

  /**
   * Gathers live diagnostics and returns overall system health report.
   */
  static async getSystemHealth() {
    const startTime = Date.now();

    // 1. Database connection & latency check
    let dbStatus = 'DISCONNECTED';
    let dbPingMs = 0;
    let collectionsCount = 0;
    try {
      const db = mongoose.connection.db;
      if (mongoose.connection.readyState === 1 && db) {
        const pingStart = Date.now();
        await db.admin().ping();
        dbPingMs = Date.now() - pingStart;
        dbStatus = 'CONNECTED';
        const collections = await db.listCollections().toArray();
        collectionsCount = collections.length;
      }
    } catch (err) {
      dbStatus = 'ERROR';
    }

    // 2. Local storage health check
    let storageStatus = 'HEALTHY';
    let storageAccessible = true;
    try {
      const uploadsDir = path.resolve('uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const testFile = path.join(uploadsDir, '.health_check_tmp');
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
    } catch (err) {
      storageStatus = 'DEGRADED';
      storageAccessible = false;
    }

    // 3. Socket.io connected clients
    let socketClientsCount = 0;
    try {
      const io = getIO();
      if (io) {
        socketClientsCount = io.engine?.clientsCount || 0;
      }
    } catch {
      socketClientsCount = 0;
    }

    // 4. Memory & system metrics
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round((memoryUsage.heapUsed / 1024 / 1024) * 10) / 10;
    const heapTotalMB = Math.round((memoryUsage.heapTotal / 1024 / 1024) * 10) / 10;
    const rssMB = Math.round((memoryUsage.rss / 1024 / 1024) * 10) / 10;
    const freeMemMB = Math.round(os.freemem() / 1024 / 1024);
    const uptimeSeconds = Math.round(process.uptime());

    // 5. Evaluate overall health status
    let overallStatus = 'HEALTHY';
    if (dbStatus !== 'CONNECTED' || !storageAccessible) {
      overallStatus = 'CRITICAL';
    } else if (dbPingMs > 300 || errorCounters.apiErrors > 50) {
      overallStatus = 'DEGRADED';
    }

    const responseTimeMs = Date.now() - startTime;

    return {
      status: overallStatus,
      timestamp: new Date(),
      api: {
        status: 'HEALTHY',
        responseTimeMs,
        uptimeSeconds,
        uptimeHuman: formatUptime(uptimeSeconds),
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          heapUsedMB,
          heapTotalMB,
          rssMB,
          freeMemMB,
        },
      },
      database: {
        status: dbStatus,
        pingMs: dbPingMs,
        readyState: mongoose.connection.readyState,
        collectionsCount,
        name: mongoose.connection.name || 'apporbit',
      },
      storage: {
        status: storageStatus,
        accessible: storageAccessible,
        type: 'LOCAL_SECURE_STORAGE',
      },
      queues: {
        status: 'HEALTHY',
        apkWorker: 'RUNNING',
        securityScanWorker: 'RUNNING',
        pendingJobs: 0,
      },
      sockets: {
        status: 'CONNECTED',
        connectedClients: socketClientsCount,
      },
      jobs: backgroundJobStatus,
      errorSummary: {
        totals: errorCounters,
        recentErrors: recentErrors.slice(0, 10),
      },
    };
  }

  /**
   * Persists a point-in-time snapshot into SystemMetric model.
   */
  static async recordMetricSnapshot() {
    try {
      const health = await this.getSystemHealth();
      await SystemMetric.create({
        status: health.status,
        api: {
          status: health.api.status,
          responseTimeMs: health.api.responseTimeMs,
          uptimeSeconds: health.api.uptimeSeconds,
          memoryHeapMB: health.api.memory.heapUsedMB,
          memoryRssMB: health.api.memory.rssMB,
        },
        database: {
          status: health.database.status,
          pingMs: health.database.pingMs,
          readyState: health.database.readyState,
          collectionsCount: health.database.collectionsCount,
        },
        storage: {
          status: health.storage.status,
          type: health.storage.type,
          accessible: health.storage.accessible,
        },
        sockets: {
          status: health.sockets.status,
          connectedClients: health.sockets.connectedClients,
        },
        jobs: {
          dailyAnalytics: health.jobs.dailyAnalytics.status,
          revenueAnalytics: health.jobs.revenueAnalytics.status,
          cleanup: health.jobs.cleanup.status,
          healthCheck: health.jobs.healthCheck.status,
          lastRunAt: new Date(),
        },
        errorCounts: health.errorSummary.totals,
      });
    } catch (err) {
      console.error('[MonitoringService] Snapshot recording failed:', err.message);
    }
  }
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default MonitoringService;
