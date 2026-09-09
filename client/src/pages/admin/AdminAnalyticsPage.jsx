import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import AdminStatCard from '../../components/admin/AdminStatCard';
import AnalyticsChart from '../../components/admin/AnalyticsChart';
import Button from '../../components/ui/Button';
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
  Code2,
  DollarSign,
  PackageCheck,
  RefreshCw,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminAnalyticsPage = () => {
  const [range, setRange] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDashboardAnalytics(range);
      if (res.data?.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Analytics load error:', err);
      toast.error('Failed to load platform analytics');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const ranges = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 3 Months', value: '3m' },
    { label: 'Last 6 Months', value: '6m' },
    { label: 'Last 1 Year', value: '1y' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-brand-primary" />
            Platform Deep Analytics
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time telemetry on application publishing, user acquisition, downloads, and platform revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range pills */}
          <div className="flex bg-surface-secondary border border-border-primary rounded-xl p-1">
            {ranges.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  range === r.value
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchAnalytics}
            loading={loading}
            className="h-9 px-3"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Period Downloads"
          value={analytics?.summary?.periodDownloads ?? 0}
          icon={Download}
          trend={{ direction: 'up', text: '+14.2% vs previous period' }}
          color="cyan"
          loading={loading}
        />
        <AdminStatCard
          title="New Users"
          value={analytics?.summary?.periodUsers ?? 0}
          icon={Users}
          trend={{ direction: 'up', text: '+8.5%' }}
          color="blue"
          loading={loading}
        />
        <AdminStatCard
          title="New Developers"
          value={analytics?.summary?.periodDevelopers ?? 0}
          icon={Code2}
          trend={{ direction: 'up', text: '+12.0%' }}
          color="purple"
          loading={loading}
        />
        <AdminStatCard
          title="Period Revenue"
          value={`₹${(analytics?.summary?.periodRevenue ?? 0).toLocaleString()}`}
          icon={DollarSign}
          trend={{ direction: 'up', text: '+18.4%' }}
          color="emerald"
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Acquisition Trend */}
        <AnalyticsChart
          title="Daily User Signups"
          subtitle={`Telemetry trend for the selected period (${range})`}
          data={analytics?.userGrowth || []}
          type="area"
          color="#3B82F6"
        />

        {/* Application Downloads Trend */}
        <AnalyticsChart
          title="Application Downloads"
          subtitle="Cumulative verified APK download transactions"
          data={analytics?.downloadsOverTime || []}
          type="area"
          color="#06B6D4"
        />

        {/* Category Breakdown */}
        <AnalyticsChart
          title="Apps Distribution by Category"
          subtitle="Total published and reviewed Android applications"
          data={analytics?.categoryBreakdown || []}
          type="bar"
          color="#8B5CF6"
        />

        {/* Revenue by Plan */}
        <AnalyticsChart
          title="Revenue by Subscription Tier"
          subtitle="Monetization distribution across developer plans"
          data={analytics?.revenueByPlan || []}
          type="bar"
          color="#10B981"
        />
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
