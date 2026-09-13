import MonitoringService from '../services/monitoringService.js';

/**
 * System Health Snapshot Job (Sprint 10)
 * Periodically records system health, memory, and error telemetry snapshots.
 */
export async function runSystemHealthJob() {
  const startTime = Date.now();
  try {
    MonitoringService.updateJobStatus('healthCheck', 'RUNNING');

    await MonitoringService.recordMetricSnapshot();

    const duration = Date.now() - startTime;
    MonitoringService.updateJobStatus('healthCheck', 'HEALTHY', duration);

    return {
      success: true,
      durationMs: duration,
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    MonitoringService.updateJobStatus('healthCheck', 'DEGRADED', duration);
    console.error('[HealthCheckJob] Snapshot error:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

export default runSystemHealthJob;
