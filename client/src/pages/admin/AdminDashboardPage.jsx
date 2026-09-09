import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Boxes,
  ShieldAlert,
  CreditCard,
  Headphones,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
} from 'lucide-react';
import adminApi from '../../api/adminApi';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AnalyticsChart from '../../components/admin/AnalyticsChart';

/**
 * Admin Dashboard Overview (Phase 7 Production Implementation)
 * Live platform KPI metrics, operational review queues, and growth analytics.
 */
export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, analyticsRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getDashboardAnalytics(range),
      ]);
      setStats(statsRes.data?.data || null);
      setAnalytics(analyticsRes.data?.data || null);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [range]);

  const userChartData = (analytics?.userGrowth || []).map((item) => ({
    label: item._id.split('-').slice(1).join('/'),
    value: item.users,
  }));

  const appChartData = (analytics?.appSubmissions || []).map((item) => ({
    label: item._id.split('-').slice(1).join('/'),
    value: item.apps,
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-extrabold text-content-primary">
            Platform Command Center
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1">
            Real-time operations, application moderation, and security posture.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface-elevated border border-white/10 text-content-primary text-xs font-mono focus:outline-none focus:border-primary"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="1y">Last Year</option>
          </select>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 rounded-xl border border-white/10 text-content-muted hover:text-white hover:bg-white/5 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Users"
          value={loading ? '...' : (stats?.users?.total || 0).toLocaleString()}
          subtitle="Registered consumers"
          icon={<Users className="w-5 h-5 text-primary" />}
        />

        <AdminStatCard
          title="Developers"
          value={loading ? '...' : (stats?.developers?.total || 0).toLocaleString()}
          subtitle={`${stats?.developers?.active || 0} Active / ${stats?.developers?.suspended || 0} Suspended`}
          icon={<Users className="w-5 h-5 text-accent-cyan" />}
        />

        <AdminStatCard
          title="Published Apps"
          value={loading ? '...' : (stats?.applications?.published || 0).toLocaleString()}
          subtitle={`${stats?.applications?.total || 0} total applications`}
          icon={<Boxes className="w-5 h-5 text-emerald-400" />}
        />

        <AdminStatCard
          title="Total Downloads"
          value={loading ? '...' : (stats?.downloads?.total || 0).toLocaleString()}
          subtitle="Platform-wide APK downloads"
          icon={<Download className="w-5 h-5 text-secondary" />}
        />
      </div>

      {/* Actionable Review Queues */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* App Review Queue */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-amber-500/30 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  App Review Queue
                </span>
              </div>
              <div className="text-3xl font-heading font-extrabold text-content-primary mt-2">
                {loading ? '...' : stats?.applications?.pendingReview || 0}
              </div>
              <p className="text-xs text-content-muted mt-1">Applications awaiting moderation</p>
            </div>
          </div>
          <Link
            to="/admin/apps?status=PENDING_REVIEW"
            className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-primary hover:text-primary-hover"
          >
            <span>Review Applications</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Security Review Center */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-purple-500/30 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                  Security Reviews
                </span>
              </div>
              <div className="text-3xl font-heading font-extrabold text-content-primary mt-2">
                {loading ? '...' : stats?.security?.pendingReviews || 0}
              </div>
              <p className="text-xs text-content-muted mt-1">
                APKs flagged for manual safety review
              </p>
            </div>
          </div>
          <Link
            to="/admin/security"
            className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-purple-400 hover:text-purple-300"
          >
            <span>Inspect Security Reports</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Support Tickets */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-accent-cyan/30 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-accent-cyan" />
                <span className="text-xs font-mono font-bold text-accent-cyan uppercase tracking-wider">
                  Support Inquiries
                </span>
              </div>
              <div className="text-3xl font-heading font-extrabold text-content-primary mt-2">
                {loading ? '...' : stats?.support?.openTickets || 0}
              </div>
              <p className="text-xs text-content-muted mt-1">Open tickets requiring agent response</p>
            </div>
          </div>
          <Link
            to="/admin/support"
            className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-accent-cyan hover:brightness-125"
          >
            <span>Open Help Desk</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          title="User Signups Trend"
          subtitle={`New registered accounts in selected period (${range})`}
          data={userChartData}
          color="primary"
          type="line"
        />

        <AnalyticsChart
          title="Application Submissions"
          subtitle={`New app submissions over timeframe (${range})`}
          data={appChartData}
          color="cyan"
          type="bar"
        />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
