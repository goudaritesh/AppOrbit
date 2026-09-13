import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Cpu,
  Radio,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Play,
  Layers,
  Zap,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminSystemHealthPage = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggeringJob, setTriggeringJob] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSystemHealth();
      const payload = res?.data?.data || res?.data || res;
      if (payload && (res?.success || res?.data?.success || payload.api)) {
        setHealth(payload);
      }
    } catch (err) {
      console.error('System health load error:', err);
      toast.error('Failed to load system diagnostics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    // Periodic poll every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const handleTriggerAggregation = async () => {
    try {
      setTriggeringJob(true);
      const res = await adminApi.triggerDailyAggregation();
      const payload = res?.data?.data || res?.data || res;
      if (res?.success || res?.data?.success || payload?.appsProcessed !== undefined) {
        toast.success(`Aggregation completed: ${payload?.appsProcessed ?? 0} apps processed`);
        fetchHealth();
      }
    } catch (err) {
      toast.error('Aggregation failed to run');
    } finally {
      setTriggeringJob(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'HEALTHY':
      case 'CONNECTED':
      case 'SUCCESS':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'DEGRADED':
      case 'RUNNING':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'CRITICAL':
      case 'ERROR':
      case 'FAILED':
      case 'DISCONNECTED':
        return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      default:
        return 'text-slate-400 border-slate-700 bg-slate-800';
    }
  };

  const isHealthy = health?.status === 'HEALTHY';

  return (
    <div className="space-y-8 animate-fadeIn pb-16 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight flex items-center gap-2.5">
              <Activity className="w-8 h-8 text-emerald-400" />
              System Health & Diagnostics
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(
                health?.status
              )}`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              {health?.status || 'CHECKING...'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-content-muted mt-1.5">
            Real-time observability into API responsiveness, database status, storage adapters, queues, and background jobs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTriggerAggregation}
            loading={triggeringJob}
            icon={<Play className="w-4 h-4 text-accent-cyan" />}
            className="text-xs font-semibold"
          >
            Run Daily Rollup
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={fetchHealth}
            loading={loading}
            icon={<RefreshCw className="w-4 h-4" />}
            className="text-xs font-semibold"
          >
            Refresh Diagnostics
          </Button>
        </div>
      </div>

      {/* Main Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. API Status Card */}
        <div className="rounded-3xl bg-surface border border-white/10 p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Server className="w-6 h-6" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(health?.api?.status)}`}>
                {health?.api?.status || 'HEALTHY'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Express API Engine</h3>
            <p className="text-xs text-content-muted mb-4">REST API layer, routing, and middleware pipelines.</p>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5 text-xs">
            <div className="flex justify-between">
              <span className="text-content-muted">Response Latency:</span>
              <span className="font-mono font-bold text-white">{health?.api?.responseTimeMs ?? 0} ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Uptime:</span>
              <span className="font-mono text-white">{health?.api?.uptimeHuman || 'Calculating...'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Heap Memory:</span>
              <span className="font-mono text-accent-cyan">
                {health?.api?.memory?.heapUsedMB} MB / {health?.api?.memory?.heapTotalMB} MB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Node & OS:</span>
              <span className="font-mono text-content-secondary">
                {health?.api?.nodeVersion} ({health?.api?.platform})
              </span>
            </div>
          </div>
        </div>

        {/* 2. MongoDB Card */}
        <div className="rounded-3xl bg-surface border border-white/10 p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Database className="w-6 h-6" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(health?.database?.status)}`}>
                {health?.database?.status || 'CONNECTED'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Cloud MongoDB Database</h3>
            <p className="text-xs text-content-muted mb-4">Primary document datastore & replica connection.</p>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5 text-xs">
            <div className="flex justify-between">
              <span className="text-content-muted">Ping Latency:</span>
              <span className="font-mono font-bold text-emerald-400">{health?.database?.pingMs ?? 0} ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Mongoose ReadyState:</span>
              <span className="font-mono text-white">{health?.database?.readyState === 1 ? '1 (Connected)' : '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Collections Tracked:</span>
              <span className="font-mono text-white">{health?.database?.collectionsCount ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Database Name:</span>
              <span className="font-mono text-white">{health?.database?.name || 'apporbit'}</span>
            </div>
          </div>
        </div>

        {/* 3. Storage Adapter Card */}
        <div className="rounded-3xl bg-surface border border-white/10 p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <HardDrive className="w-6 h-6" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(health?.storage?.status)}`}>
                {health?.storage?.status || 'HEALTHY'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Storage Subsystem</h3>
            <p className="text-xs text-content-muted mb-4">APK binary storage and multimedia assets volume.</p>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5 text-xs">
            <div className="flex justify-between">
              <span className="text-content-muted">Adapter Type:</span>
              <span className="font-mono font-bold text-white">{health?.storage?.type || 'LOCAL_STORAGE'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Filesystem Access:</span>
              <span className="font-mono text-emerald-400">
                {health?.storage?.accessible ? 'Read / Write OK' : 'Restricted'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Target Directory:</span>
              <span className="font-mono text-content-dim truncate max-w-[150px]">/uploads/apk</span>
            </div>
          </div>
        </div>

        {/* 4. Socket.io Real-time Gateway */}
        <div className="rounded-3xl bg-surface border border-white/10 p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Radio className="w-6 h-6" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(health?.sockets?.status)}`}>
                {health?.sockets?.status || 'CONNECTED'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">WebSocket Server</h3>
            <p className="text-xs text-content-muted mb-4">Real-time alerts, review streams, and scan updates.</p>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5 text-xs">
            <div className="flex justify-between">
              <span className="text-content-muted">Connected Clients:</span>
              <span className="font-mono font-bold text-purple-400 text-sm">
                {health?.sockets?.connectedClients ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Transport Protocol:</span>
              <span className="font-mono text-white">WebSocket / Polling</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Room Broadcasting:</span>
              <span className="font-mono text-emerald-400">Active</span>
            </div>
          </div>
        </div>

        {/* 5. Worker Queues Card */}
        <div className="rounded-3xl bg-surface border border-white/10 p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(health?.queues?.status)}`}>
                {health?.queues?.status || 'HEALTHY'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Async Processing Queues</h3>
            <p className="text-xs text-content-muted mb-4">APK extraction, metadata parsing, and anti-malware pipeline.</p>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5 text-xs">
            <div className="flex justify-between">
              <span className="text-content-muted">APK Queue Worker:</span>
              <span className="font-mono text-emerald-400">{health?.queues?.apkWorker || 'READY'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Security Scanner:</span>
              <span className="font-mono text-emerald-400">{health?.queues?.securityScanWorker || 'READY'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Pending In-Flight Jobs:</span>
              <span className="font-mono text-white">{health?.queues?.pendingJobs ?? 0}</span>
            </div>
          </div>
        </div>

        {/* 6. Background Jobs Overview */}
        <div className="rounded-3xl bg-surface border border-white/10 p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Clock className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border text-accent-cyan border-accent-cyan/30 bg-accent-cyan/10">
                AUTOMATED
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Scheduled Jobs Registry</h3>
            <p className="text-xs text-content-muted mb-4">Daily analytics rollups, revenue summaries, and retention cleanup.</p>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5 text-xs">
            <div className="flex justify-between">
              <span className="text-content-muted">Daily Analytics Job:</span>
              <span className={`font-mono font-bold ${getStatusColor(health?.jobs?.dailyAnalytics?.status)}`}>
                {health?.jobs?.dailyAnalytics?.status || 'IDLE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Revenue Rollup Job:</span>
              <span className={`font-mono font-bold ${getStatusColor(health?.jobs?.revenueAnalytics?.status)}`}>
                {health?.jobs?.revenueAnalytics?.status || 'IDLE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Retention Cleanup Job:</span>
              <span className={`font-mono font-bold ${getStatusColor(health?.jobs?.cleanup?.status)}`}>
                {health?.jobs?.cleanup?.status || 'IDLE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Priority 9: Error Monitoring Pool */}
      <div className="rounded-3xl bg-surface border border-white/10 p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
              Error Monitoring & Diagnostics Pool
            </h3>
            <p className="text-xs text-content-muted mt-0.5">
              Live tracking of operational failures, database errors, and upload issues.
            </p>
          </div>

          {/* Aggregate Counters */}
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-surface-low border border-white/10 text-xs">
              <span className="text-content-dim">API: </span>
              <span className="font-mono font-bold text-rose-400">{health?.errorSummary?.totals?.apiErrors ?? 0}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-surface-low border border-white/10 text-xs">
              <span className="text-content-dim">DB: </span>
              <span className="font-mono font-bold text-amber-400">{health?.errorSummary?.totals?.dbErrors ?? 0}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-surface-low border border-white/10 text-xs">
              <span className="text-content-dim">Upload: </span>
              <span className="font-mono font-bold text-blue-400">{health?.errorSummary?.totals?.uploadFailures ?? 0}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-surface-low border border-white/10 text-xs">
              <span className="text-content-dim">Payment: </span>
              <span className="font-mono font-bold text-purple-400">{health?.errorSummary?.totals?.paymentFailures ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Error stream table */}
        {(!health?.errorSummary?.recentErrors || health.errorSummary.recentErrors.length === 0) ? (
          <div className="p-8 text-center rounded-2xl bg-surface-low border border-white/5">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No Errors Reported in Monitoring Pool</p>
            <p className="text-xs text-content-dim mt-1">All Express endpoints and database pipelines operating within normal parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-content-dim border-b border-white/10">
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Message</th>
                  <th className="pb-3 font-semibold">Endpoint</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {health.errorSummary.recentErrors.map((err) => (
                  <tr key={err.id} className="hover:bg-white/5 transition">
                    <td className="py-2.5 pr-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {err.category}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-sans text-white max-w-xs truncate" title={err.message}>
                      {err.message}
                    </td>
                    <td className="py-2.5 pr-3 text-content-muted">
                      {err.method} {err.path || '-'}
                    </td>
                    <td className="py-2.5 pr-3 text-rose-400 font-bold">{err.statusCode}</td>
                    <td className="py-2.5 text-content-dim">
                      {new Date(err.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSystemHealthPage;
