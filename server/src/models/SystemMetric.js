import mongoose from 'mongoose';

/**
 * System Metric Model (Sprint 10 Observability & Health Monitoring)
 * Snapshots platform telemetry, infrastructure metrics, and failure frequencies.
 */
const systemMetricSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['HEALTHY', 'DEGRADED', 'CRITICAL'],
      default: 'HEALTHY',
      index: true,
    },
    api: {
      status: { type: String, default: 'HEALTHY' },
      responseTimeMs: { type: Number, default: 0 },
      uptimeSeconds: { type: Number, default: 0 },
      memoryHeapMB: { type: Number, default: 0 },
      memoryRssMB: { type: Number, default: 0 },
    },
    database: {
      status: { type: String, default: 'CONNECTED' },
      pingMs: { type: Number, default: 0 },
      readyState: { type: Number, default: 1 },
      collectionsCount: { type: Number, default: 0 },
    },
    storage: {
      status: { type: String, default: 'HEALTHY' },
      type: { type: String, default: 'LOCAL' },
      accessible: { type: Boolean, default: true },
    },
    queues: {
      status: { type: String, default: 'IDLE' },
      apkQueueActive: { type: Number, default: 0 },
      securityScanPending: { type: Number, default: 0 },
    },
    sockets: {
      status: { type: String, default: 'CONNECTED' },
      connectedClients: { type: Number, default: 0 },
    },
    jobs: {
      dailyAnalytics: { type: String, default: 'IDLE' },
      revenueAnalytics: { type: String, default: 'IDLE' },
      cleanup: { type: String, default: 'IDLE' },
      healthCheck: { type: String, default: 'HEALTHY' },
      lastRunAt: { type: Date, default: null },
    },
    errorCounts: {
      apiErrors: { type: Number, default: 0 },
      dbErrors: { type: Number, default: 0 },
      uploadFailures: { type: Number, default: 0 },
      paymentFailures: { type: Number, default: 0 },
      securityScanFailures: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// 30-day automatic TTL index for raw metrics
systemMetricSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const SystemMetric = mongoose.model('SystemMetric', systemMetricSchema);
export default SystemMetric;
