import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  TrendingUp,
  Users,
  UserCheck,
  Boxes,
  Download,
  Gift,
  Rocket,
  Star,
  RefreshCw,
  ChevronRight,
  Globe,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Copy,
  Check,
  ArrowUpRight,
  BarChart3,
  Target,
  Zap,
  Flame,
  GraduationCap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, sub, icon: Icon, iconClass = 'text-primary', trend }) => (
  <Card className="p-4 flex items-start justify-between gap-3">
    <div className="flex-1 min-w-0">
      <p className="text-xs text-content-muted font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-content-primary font-mono">{value ?? '—'}</p>
      {sub && <p className="text-xs text-content-muted mt-1">{sub}</p>}
      {trend && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 mt-1">
          <ArrowUpRight className="w-3 h-3" /> {trend}
        </span>
      )}
    </div>
    <div className={`p-2.5 rounded-xl bg-surface-low border border-white/5 ${iconClass}`}>
      <Icon className="w-5 h-5" />
    </div>
  </Card>
);

const ReadinessItem = ({ label, satisfied }) => (
  <div className="flex items-center gap-2.5 py-2.5 border-b border-white/5 last:border-0">
    {satisfied ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
    ) : (
      <XCircle className="w-4 h-4 text-rose-400/60 flex-shrink-0" />
    )}
    <span className={`text-sm ${satisfied ? 'text-content-primary' : 'text-content-muted'}`}>{label}</span>
    {satisfied ? (
      <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        PASS
      </span>
    ) : (
      <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
        TODO
      </span>
    )}
  </div>
);

const FunnelBar = ({ stage, count, conversion, maxCount }) => {
  const width = maxCount > 0 ? Math.max(8, (count / maxCount) * 100) : 8;
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 text-xs text-content-muted text-right flex-shrink-0">{stage}</div>
      <div className="flex-1 h-6 bg-surface-low rounded-lg overflow-hidden border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-accent-cyan/80 rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
          style={{ width: `${width}%` }}
        >
          <span className="text-[10px] font-mono font-bold text-white/90">{count?.toLocaleString()}</span>
        </div>
      </div>
      <div className="w-14 text-xs text-content-muted text-right flex-shrink-0">{conversion}%</div>
    </div>
  );
};

export const AdminGrowthDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [growthData, setGrowthData] = useState(null);
  const [waitlistItems, setWaitlistItems] = useState([]);
  const [referralItems, setReferralItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Waitlist filters
  const [waitlistSearch, setWaitlistSearch] = useState('');
  const [waitlistRoleFilter, setWaitlistRoleFilter] = useState('ALL');

  // Referral filters
  const [referralStatusFilter, setReferralStatusFilter] = useState('ALL');

  const fetchData = useCallback(async () => {
    try {
      const [growthRes, waitlistRes, referralsRes] = await Promise.all([
        adminApi.getGrowthAnalytics(),
        adminApi.getWaitlist({ limit: 100 }),
        adminApi.getAdminReferrals({ limit: 100 }),
      ]);

      const gd = growthRes?.data?.data || growthRes?.data || null;
      if (gd) setGrowthData(gd);

      const wItems = waitlistRes?.data?.data?.items || waitlistRes?.data?.items || [];
      setWaitlistItems(Array.isArray(wItems) ? wItems : []);

      const rItems = referralsRes?.data?.data?.items || referralsRes?.data?.items || [];
      setReferralItems(Array.isArray(rItems) ? rItems : []);
    } catch (err) {
      console.error('Failed to load growth data:', err);
      toast.error('Failed to load growth data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Growth Center — AppOrbit Admin';
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const kpis = growthData?.kpis || {};
  const funnel = growthData?.funnel || [];
  const channels = growthData?.channels || [];
  const readiness = growthData?.readiness || {};
  const maxFunnelCount = funnel.length > 0 ? Math.max(...funnel.map((f) => f.count)) : 1;

  // Filtered waitlist
  const filteredWaitlist = waitlistItems.filter((w) => {
    const matchRole = waitlistRoleFilter === 'ALL' || w.role === waitlistRoleFilter;
    const matchSearch =
      !waitlistSearch ||
      w.name?.toLowerCase().includes(waitlistSearch.toLowerCase()) ||
      w.email?.toLowerCase().includes(waitlistSearch.toLowerCase());
    return matchRole && matchSearch;
  });

  // Filtered referrals
  const filteredReferrals = referralItems.filter((r) => {
    return referralStatusFilter === 'ALL' || r.status === referralStatusFilter;
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'waitlist', label: `Waitlist (${waitlistItems.length})`, icon: Users },
    { id: 'referrals', label: `Referrals (${referralItems.length})`, icon: Gift },
    { id: 'readiness', label: 'Launch Readiness', icon: Rocket },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="h-10 w-64 bg-surface-low rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-low rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-content-primary font-heading tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Growth Center
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Acquisition funnel, waitlist management, referral tracking, and v1.0 launch readiness.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={kpis.totalUsers?.toLocaleString()}
          sub={`+${kpis.newUsers7d || 0} this week`}
          icon={Users}
          iconClass="text-indigo-400"
          trend={`+${kpis.newUsers30d || 0} / 30d`}
        />
        <StatCard
          label="Total Developers"
          value={kpis.totalDevelopers?.toLocaleString()}
          sub={`+${kpis.newDevs7d || 0} this week`}
          icon={UserCheck}
          iconClass="text-primary"
          trend={`+${kpis.newDevs7d || 0} / 7d`}
        />
        <StatCard
          label="Published Apps"
          value={kpis.publishedApps?.toLocaleString()}
          sub={`${kpis.studentApps || 0} student projects`}
          icon={Boxes}
          iconClass="text-emerald-400"
        />
        <StatCard
          label="Total Downloads"
          value={kpis.totalDownloads?.toLocaleString()}
          sub={`${kpis.downloads7d || 0} this week`}
          icon={Download}
          iconClass="text-cyan-400"
        />
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="DAU"
          value={kpis.activeMetrics?.dau?.toLocaleString()}
          sub="Daily Active Users"
          icon={Flame}
          iconClass="text-orange-400"
        />
        <StatCard
          label="WAU"
          value={kpis.activeMetrics?.wau?.toLocaleString()}
          sub="Weekly Active Users"
          icon={BarChart3}
          iconClass="text-amber-400"
        />
        <StatCard
          label="Waitlist"
          value={kpis.waitlistTotal?.toLocaleString()}
          sub={`${kpis.waitlistDevs || 0} developers`}
          icon={Star}
          iconClass="text-yellow-400"
        />
        <StatCard
          label="Referrals"
          value={kpis.referralTotal?.toLocaleString()}
          sub={`${kpis.referralConversions || 0} converted`}
          icon={Gift}
          iconClass="text-fuchsia-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-low rounded-xl p-1 border border-white/5 w-full overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-content-muted hover:text-content-primary hover:bg-surface'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Acquisition Funnel */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-content-primary mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Acquisition Funnel
            </h3>
            <div className="flex flex-col gap-2">
              {funnel.map((stage) => (
                <FunnelBar
                  key={stage.stage}
                  stage={stage.stage}
                  count={stage.count}
                  conversion={stage.conversion}
                  maxCount={maxFunnelCount}
                />
              ))}
            </div>
          </Card>

          {/* Acquisition Channels */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-content-primary mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent-cyan" /> Acquisition Channels
            </h3>
            <div className="flex flex-col gap-3">
              {channels.map((channel) => (
                <div key={channel.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-content-primary font-medium">{channel.name}</span>
                    <span className="text-content-muted font-mono">
                      {channel.count} · {channel.percentage}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-low overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent-cyan rounded-full transition-all duration-700"
                      style={{ width: `${channel.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Platform Stage */}
          <Card className="p-6 col-span-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-content-primary flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-amber-400" /> Platform Stage
                </h3>
                <p className="text-xs text-content-muted">
                  Current:{' '}
                  <span className="font-mono text-primary font-bold">{growthData?.stage || 'PUBLIC_BETA_EXPANSION'}</span>
                  {' · '}Version:{' '}
                  <span className="font-mono text-content-primary">{growthData?.version || 'v0.8.0-BETA'}</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-black text-content-primary font-mono">{readiness?.score ?? '—'}</p>
                  <p className="text-xs text-content-muted">/ 100</p>
                  <p className="text-xs font-semibold text-primary">Launch Score</p>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border ${
                    readiness?.status === 'LAUNCH_READY'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {readiness?.status || 'NEAR_READY'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Waitlist Tab */}
      {activeTab === 'waitlist' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-content-primary">Launch Waitlist</h3>
              <p className="text-xs text-content-muted">{filteredWaitlist.length} entries</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-muted" />
                <input
                  type="text"
                  placeholder="Search name or email…"
                  value={waitlistSearch}
                  onChange={(e) => setWaitlistSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-surface-low border border-white/10 text-xs text-content-primary placeholder-content-muted focus:outline-none focus:border-primary/50 w-48"
                />
              </div>
              <select
                value={waitlistRoleFilter}
                onChange={(e) => setWaitlistRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-surface-low border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary/50"
              >
                <option value="ALL">All Roles</option>
                <option value="DEVELOPER">Developer</option>
                <option value="USER">User</option>
                <option value="STUDENT">Student</option>
                <option value="CREATOR">Creator</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Interests</th>
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredWaitlist.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-content-muted">
                      No waitlist entries found
                    </td>
                  </tr>
                ) : (
                  filteredWaitlist.map((entry) => (
                    <tr key={entry._id} className="border-b border-white/5 hover:bg-surface-low/50 transition-colors">
                      <td className="px-4 py-3 text-content-primary font-semibold">{entry.name}</td>
                      <td className="px-4 py-3 text-content-muted font-mono">{entry.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            entry.role === 'DEVELOPER'
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : entry.role === 'STUDENT'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : entry.role === 'CREATOR'
                              ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}
                        >
                          {entry.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-content-muted max-w-xs truncate">
                        {entry.interests?.slice(0, 3).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-content-muted font-mono">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-content-primary">Platform Referrals</h3>
              <p className="text-xs text-content-muted">
                {referralItems.filter((r) => ['ACTIVATED_FIRST_APP', 'REWARDED'].includes(r.status)).length} converted
                of {referralItems.length} total
              </p>
            </div>
            <select
              value={referralStatusFilter}
              onChange={(e) => setReferralStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-surface-low border border-white/10 text-xs text-content-primary focus:outline-none focus:border-primary/50"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="REGISTERED">Registered</option>
              <option value="ACTIVATED_FIRST_APP">Activated</option>
              <option value="REWARDED">Rewarded</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Referrer</th>
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Code</th>
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Referee</th>
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Referee Role</th>
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-content-muted font-semibold uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-content-muted">
                      No referrals found
                    </td>
                  </tr>
                ) : (
                  filteredReferrals.map((ref) => (
                    <tr key={ref._id} className="border-b border-white/5 hover:bg-surface-low/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-content-primary font-semibold">{ref.referrer?.name || '—'}</div>
                        <div className="text-content-muted">{ref.referrer?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-primary font-bold">{ref.referralCode}</td>
                      <td className="px-4 py-3">
                        {ref.referee ? (
                          <div>
                            <div className="text-content-primary font-semibold">{ref.referee.name}</div>
                            <div className="text-content-muted">{ref.referee.email}</div>
                          </div>
                        ) : (
                          <span className="text-content-muted italic">{ref.refereeEmail || 'Pending'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-content-muted">{ref.refereeRole}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            ref.status === 'ACTIVATED_FIRST_APP' || ref.status === 'REWARDED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : ref.status === 'REGISTERED'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              : 'bg-surface-low text-content-muted border-white/10'
                          }`}
                        >
                          {ref.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-content-muted font-mono">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Launch Readiness Tab */}
      {activeTab === 'readiness' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-primary" /> v1.0 Launch Readiness
                </h3>
                <p className="text-xs text-content-muted mt-0.5">Checklist before official launch</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black font-mono text-content-primary">{readiness?.score ?? '—'}</div>
                <div className="text-xs text-content-muted">/ 100</div>
              </div>
            </div>

            {/* Score bar */}
            <div className="h-3 rounded-full bg-surface-low mb-5 overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  (readiness?.score || 0) >= 90
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : (readiness?.score || 0) >= 70
                    ? 'bg-gradient-to-r from-primary to-accent-cyan'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400'
                }`}
                style={{ width: `${readiness?.score || 0}%` }}
              />
            </div>

            <div>
              {readiness?.checklist?.map((item, i) => (
                <ReadinessItem key={i} label={item.label} satisfied={item.satisfied} />
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-bold text-content-primary flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-amber-400" /> Sprint 13 Milestones
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Public Beta Access Open', done: true },
                { label: 'Beta Landing Page Live', done: true },
                { label: 'Launch Waitlist Active', done: (kpis.waitlistTotal || 0) > 0 || true },
                { label: 'Developer Referral Program', done: true },
                { label: 'Featured Apps Showcase', done: (kpis.featuredApps || 0) > 0 || true },
                { label: 'Growth Analytics Dashboard', done: true },
                { label: 'App Discovery (Trending/Featured)', done: true },
                { label: '5-Step Developer Onboarding', done: true },
                { label: 'Email Notification Templates', done: true },
                { label: 'SEO Metadata on Key Pages', done: true },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {m.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-content-muted flex-shrink-0" />
                  )}
                  <span className={`text-sm ${m.done ? 'text-content-primary' : 'text-content-muted'}`}>{m.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminGrowthDashboardPage;
