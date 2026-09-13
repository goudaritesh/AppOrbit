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
  Layers,
  Search,
  AlertCircle,
  Crown,
  Sparkles,
  CreditCard,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminAnalyticsPage = () => {
  const [range, setRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'revenue' | 'search'
  const [platformData, setPlatformData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [searchData, setSearchData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAllAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [platformRes, revenueRes, searchRes] = await Promise.all([
        adminApi.getPlatformAnalytics(range).catch(() => ({ data: { data: null } })),
        adminApi.getRevenueAnalytics(range).catch(() => ({ data: { data: null } })),
        adminApi.getSearchAnalytics(range).catch(() => ({ data: { data: null } })),
      ]);

      const extract = (res) => {
        if (!res) return null;
        if (res.data && res.data.data !== undefined) return res.data.data; // fallback for catch block
        if (res.data) return res.data; // standard successful payload
        return res;
      };

      setPlatformData(extract(platformRes));
      setRevenueData(extract(revenueRes));
      setSearchData(extract(searchRes));
    } catch (err) {
      console.error('Analytics load error:', err);
      toast.error('Failed to load platform analytics');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  const ranges = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
  ];

  const overview = platformData?.overview || {};

  return (
    <div className="space-y-8 animate-fadeIn pb-16 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-8 h-8 text-brand-primary text-primary" />
            Platform Telemetry & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1">
            Real-time telemetry on application publishing, user acquisition, downloads, search behavior, and platform revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex bg-surface border border-white/10 rounded-2xl p-1 shadow-sm">
            {ranges.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                  range === r.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-content-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchAllAnalytics}
            loading={loading}
            icon={<RefreshCw className="w-4 h-4" />}
            title="Refresh analytics data"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-white/10 text-white border border-white/20 shadow-sm'
              : 'text-content-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          Platform Overview
        </button>

        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'revenue'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-content-muted hover:text-emerald-400 hover:bg-white/5'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          Revenue Analytics
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'search'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm'
              : 'text-content-muted hover:text-blue-400 hover:bg-white/5'
          }`}
        >
          <Search className="w-4 h-4 text-blue-400" />
          Search Insights
        </button>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-surface border border-white/10 p-4">
          <div className="flex items-center justify-between text-content-dim mb-1 text-xs">
            <span>Total Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white">
            {overview.totalUsers ?? 0}
          </div>
        </div>

        <div className="rounded-2xl bg-surface border border-white/10 p-4">
          <div className="flex items-center justify-between text-content-dim mb-1 text-xs">
            <span>Developers</span>
            <Code2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white">
            {overview.totalDevelopers ?? 0}
          </div>
        </div>

        <div className="rounded-2xl bg-surface border border-white/10 p-4">
          <div className="flex items-center justify-between text-content-dim mb-1 text-xs">
            <span>Total Apps</span>
            <PackageCheck className="w-4 h-4 text-accent-cyan" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white">
            {overview.totalApplications ?? 0}
          </div>
          <div className="text-[10px] text-content-dim mt-0.5">
            {overview.publishedApplications ?? 0} published
          </div>
        </div>

        <div className="rounded-2xl bg-surface border border-white/10 p-4">
          <div className="flex items-center justify-between text-content-dim mb-1 text-xs">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-amber-400">
            {overview.pendingApplications ?? 0}
          </div>
        </div>

        <div className="rounded-2xl bg-surface border border-white/10 p-4">
          <div className="flex items-center justify-between text-content-dim mb-1 text-xs">
            <span>Downloads</span>
            <Download className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white">
            {overview.totalDownloads ?? 0}
          </div>
        </div>

        <div className="rounded-2xl bg-surface border border-white/10 p-4">
          <div className="flex items-center justify-between text-content-dim mb-1 text-xs">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">
            ₹{(overview.totalRevenue ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-content-dim mt-0.5">
            ₹{(overview.revenueThisMonth ?? 0).toLocaleString()} this month
          </div>
        </div>
      </div>

      {/* TAB 1: PLATFORM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Acquisition */}
            <div className="rounded-3xl bg-surface border border-white/10 p-6 shadow-card">
              <h3 className="text-base font-bold text-white mb-1">User Growth & Signups</h3>
              <p className="text-xs text-content-muted mb-4">Daily registered users and developer onboardings.</p>
              <div className="h-48 flex items-center justify-center border border-dashed border-white/10 rounded-2xl p-4 text-xs text-content-dim">
                Active telemetry tracked across {overview.totalUsers ?? 0} total registered users.
              </div>
            </div>

            {/* Application Categories */}
            <div className="rounded-3xl bg-surface border border-white/10 p-6 shadow-card">
              <h3 className="text-base font-bold text-white mb-1">Applications by Status</h3>
              <p className="text-xs text-content-muted mb-4">Publishing velocity and moderation queue health.</p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-content-secondary">Published & Discoverable</span>
                  <span className="font-mono font-bold text-emerald-400">{overview.publishedApplications ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-content-secondary">Pending Security / Moderation</span>
                  <span className="font-mono font-bold text-amber-400">{overview.pendingApplications ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-content-secondary">Active Developer Subscriptions</span>
                  <span className="font-mono font-bold text-accent-cyan">{overview.activeSubscriptions ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-content-secondary">Platform Community Reviews</span>
                  <span className="font-mono font-bold text-purple-400">{overview.totalReviews ?? 0} (⭐ {overview.averagePlatformRating ?? 5.0})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVENUE ANALYTICS MODULE (Priority 5) */}
      {activeTab === 'revenue' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Revenue KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl bg-surface border border-emerald-500/20 p-6 shadow-card">
              <div className="text-xs font-semibold text-emerald-400 mb-1">TOTAL REVENUE</div>
              <div className="text-3xl font-black text-white font-mono">
                ₹{(revenueData?.totalRevenue ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-content-dim mt-2">All confirmed lifetime payments</p>
            </div>

            <div className="rounded-3xl bg-surface border border-white/10 p-6 shadow-card">
              <div className="text-xs font-semibold text-blue-400 mb-1">REVENUE THIS MONTH</div>
              <div className="text-3xl font-black text-white font-mono">
                ₹{(revenueData?.revenueThisMonth ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-content-dim mt-2">Current billing calendar cycle</p>
            </div>

            <div className="rounded-3xl bg-surface border border-white/10 p-6 shadow-card">
              <div className="text-xs font-semibold text-accent-cyan mb-1">ACTIVE SUBSCRIPTIONS</div>
              <div className="text-3xl font-black text-white font-mono">
                {revenueData?.activeSubscriptions ?? 0}
              </div>
              <p className="text-xs text-content-dim mt-2">Subscribed developers</p>
            </div>

            <div className="rounded-3xl bg-surface border border-white/10 p-6 shadow-card">
              <div className="text-xs font-semibold text-purple-400 mb-1">PAYMENT SUCCESS RATE</div>
              <div className="text-3xl font-black text-white font-mono">
                {revenueData?.successfulPayments ? (
                  ((revenueData.successfulPayments / (revenueData.successfulPayments + (revenueData.failedPayments || 0))) * 100).toFixed(0) + '%'
                ) : '100%'}
              </div>
              <p className="text-xs text-content-dim mt-2">
                {revenueData?.successfulPayments ?? 0} succeeded • {revenueData?.failedPayments ?? 0} failed
              </p>
            </div>
          </div>

          {/* Revenue by Plan Cards */}
          <div className="rounded-3xl bg-surface border border-white/10 p-6 sm:p-8 shadow-card">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Revenue by Subscription Tier
            </h3>
            <p className="text-xs text-content-muted mb-6">Distribution across Silver, Gold, and Diamond tiers.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Free */}
              <div className="rounded-2xl bg-surface-low border border-white/10 p-4">
                <div className="text-xs font-bold text-content-dim uppercase">Free Plan</div>
                <div className="text-xl font-bold text-white font-mono mt-1">₹0</div>
                <div className="text-xs text-content-muted mt-2">1 App publishing quota</div>
              </div>

              {/* Silver */}
              <div className="rounded-2xl bg-surface-low border border-slate-600 p-4">
                <div className="flex justify-between items-start">
                  <div className="text-xs font-bold text-slate-300 uppercase">Silver Plan</div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">₹399/mo</span>
                </div>
                <div className="text-xl font-bold text-white font-mono mt-1">
                  ₹{(revenueData?.plans?.SILVER?.amount ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-content-muted mt-2">
                  {revenueData?.plans?.SILVER?.count ?? 0} subscriptions
                </div>
              </div>

              {/* Gold */}
              <div className="rounded-2xl bg-surface-low border border-amber-500/40 p-4">
                <div className="flex justify-between items-start">
                  <div className="text-xs font-bold text-amber-400 uppercase">Gold Plan</div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">₹599/mo</span>
                </div>
                <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                  ₹{(revenueData?.plans?.GOLD?.amount ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-content-muted mt-2">
                  {revenueData?.plans?.GOLD?.count ?? 0} subscriptions
                </div>
              </div>

              {/* Diamond */}
              <div className="rounded-2xl bg-surface-low border border-accent-cyan/40 p-4">
                <div className="flex justify-between items-start">
                  <div className="text-xs font-bold text-accent-cyan uppercase">Diamond Plan</div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan">₹999/mo</span>
                </div>
                <div className="text-xl font-bold text-accent-cyan font-mono mt-1">
                  ₹{(revenueData?.plans?.DIAMOND?.amount ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-content-muted mt-2">
                  {revenueData?.plans?.DIAMOND?.count ?? 0} subscriptions
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SEARCH INSIGHTS (Priority 7) */}
      {activeTab === 'search' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Searches */}
            <div className="rounded-3xl bg-surface border border-white/10 p-6 shadow-card">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                Top Searched Queries
              </h3>
              <p className="text-xs text-content-muted mb-4">Most frequent terms users searched for in marketplace.</p>

              {(!searchData?.topSearches || searchData.topSearches.length === 0) ? (
                <div className="p-8 text-center text-xs text-content-dim rounded-2xl bg-surface-low">
                  No search telemetry recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {searchData.topSearches.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-low text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-content-dim w-4">{idx + 1}.</span>
                        <span className="font-semibold text-white">"{s.query}"</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-mono text-[11px]">
                        {s.frequency} searches
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Zero-Result Searches */}
            <div className="rounded-3xl bg-surface border border-white/10 p-6 shadow-card">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Zero-Result Searches (Missing Demand)
              </h3>
              <p className="text-xs text-content-muted mb-4">
                Queries that returned zero results, indicating apps or categories users want.
              </p>

              {(!searchData?.zeroResultQueries || searchData.zeroResultQueries.length === 0) ? (
                <div className="p-8 text-center text-xs text-content-dim rounded-2xl bg-surface-low">
                  No zero-result searches reported in this period.
                </div>
              ) : (
                <div className="space-y-2">
                  {searchData.zeroResultQueries.map((z, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                      <span className="font-medium text-amber-300">"{z.query}"</span>
                      <span className="text-amber-400 font-mono text-[11px] font-bold">
                        {z.frequency} attempts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;
