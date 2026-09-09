import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Boxes,
  DownloadCloud,
  Eye,
  Star,
  PlusCircle,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  FileEdit,
  Send,
  BarChart3,
  Layers,
  RefreshCw,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ApplicationStatusBadge from '../../components/developer/ApplicationStatusBadge';
import { getDeveloperAnalytics } from '../../api/developerPortalApi';
import { formatNumber, formatDate } from '../../utils/formatters';

export const DeveloperDashboardPage = () => {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDeveloperAnalytics();
      setAnalytics(res.data || null);
    } catch (err) {
      console.error('Failed to load developer dashboard:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Developer Dashboard — AppOrbit';
    fetchDashboardData();
  }, []);

  const overview = analytics?.overview || {
    totalApps: 0,
    publishedApps: 0,
    draftApps: 0,
    pendingApps: 0,
    archivedApps: 0,
    rejectedApps: 0,
    totalDownloads: 0,
    totalViews: 0,
    averageRating: 0,
  };

  const statusCounts = analytics?.statusCounts || {};
  const recentApps = analytics?.recentApps || [];

  return (
    <div className="flex flex-col gap-8">
      {/* 1. TOP HEADER & GREETING */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-content-primary tracking-tight">
              Developer Dashboard
            </h1>
            <span className="text-2xl select-none">👋</span>
          </div>
          <p className="text-xs sm:text-sm text-content-muted">
            Overview of your Android applications, active deployments, and release metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/developer/apps/create">
            <Button variant="primary" size="md" icon={<PlusCircle className="w-4 h-4" />}>
              Create Application
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose flex items-center justify-between text-sm">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        </div>
      )}

      {/* 2. KEY METRICS STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Applications */}
        <Card padding="md" className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-content-muted uppercase tracking-wider">
                Total Applications
              </span>
              <span className="text-3xl font-extrabold font-heading text-content-primary">
                {loading ? '...' : overview.totalApps}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-xs font-mono text-content-dim">
            <span className="text-accent-emerald font-semibold">{overview.publishedApps}</span>
            <span>Published</span>
            <span className="mx-1">•</span>
            <span className="text-accent-cyan font-semibold">{overview.draftApps}</span>
            <span>Drafts</span>
          </div>
        </Card>

        {/* Metric 2: Total Downloads */}
        <Card padding="md" className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-content-muted uppercase tracking-wider">
                Total Downloads
              </span>
              <span className="text-3xl font-extrabold font-heading text-accent-cyan">
                {loading ? '...' : formatNumber(overview.totalDownloads)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
              <DownloadCloud className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs font-mono text-content-dim">
            <span>Cumulative package deliveries</span>
          </div>
        </Card>

        {/* Metric 3: Total Views */}
        <Card padding="md" className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-content-muted uppercase tracking-wider">
                Listing Views
              </span>
              <span className="text-3xl font-extrabold font-heading text-accent-purple">
                {loading ? '...' : formatNumber(overview.totalViews)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs font-mono text-content-dim">
            <span>Marketplace impressions</span>
          </div>
        </Card>

        {/* Metric 4: Average Rating */}
        <Card padding="md" className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-content-muted uppercase tracking-wider">
                Average Rating
              </span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold font-heading text-amber-400">
                  {loading ? '...' : overview.averageRating || '—'}
                </span>
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs font-mono text-content-dim">
            <span>Overall community feedback</span>
          </div>
        </Card>
      </div>

      {/* 3. APPLICATION STATUS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Published', count: statusCounts.PUBLISHED || 0, color: 'text-accent-emerald' },
          { label: 'Pending Review', count: statusCounts.PENDING_REVIEW || 0, color: 'text-amber-400' },
          { label: 'Drafts', count: statusCounts.DRAFT || 0, color: 'text-content-secondary' },
          { label: 'Rejected', count: statusCounts.REJECTED || 0, color: 'text-accent-rose' },
          { label: 'Archived', count: statusCounts.ARCHIVED || 0, color: 'text-content-dim' },
          { label: 'Suspended', count: statusCounts.SUSPENDED || 0, color: 'text-accent-rose' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-surface border border-white/5 flex flex-col gap-1"
          >
            <span className="text-[10px] font-mono uppercase text-content-dim tracking-wider">
              {item.label}
            </span>
            <span className={`text-xl font-bold font-heading ${item.color}`}>
              {loading ? '—' : item.count}
            </span>
          </div>
        ))}
      </div>

      {/* 4. RECENT APPLICATIONS TABLE */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-heading text-content-primary">
              Recently Updated Applications
            </h2>
            <p className="text-xs text-content-muted">
              Quick access to your active and draft listings.
            </p>
          </div>
          <Link to="/developer/apps">
            <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              View All Applications
            </Button>
          </Link>
        </div>

        <Card padding="none" className="overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-content-muted">
              Loading recent applications...
            </div>
          ) : recentApps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-elevated/70 border-b border-white/10 text-content-muted font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Application</th>
                    <th className="py-3.5 px-4 font-semibold">Category</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold">Downloads</th>
                    <th className="py-3.5 px-4 font-semibold">Last Updated</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-content-secondary">
                  {recentApps.map((app) => (
                    <tr key={app._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-white/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0 overflow-hidden">
                            {app.icon ? (
                              <img src={app.icon} alt="" className="w-full h-full object-cover" />
                            ) : (
                              app.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/developer/apps/${app._id}`}
                              className="font-bold text-content-primary hover:text-primary transition-colors block truncate"
                            >
                              {app.name}
                            </Link>
                            <span className="text-[11px] text-content-dim font-mono truncate block">
                              v{app.currentVersion?.version || '1.0.0'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-content-muted">
                          {app.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <ApplicationStatusBadge status={app.status} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-content-primary">
                        {formatNumber(app.downloadCount || 0)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-content-dim">
                        {formatDate(app.updatedAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/developer/apps/${app._id}`}>
                            <button
                              className="p-1.5 rounded-lg bg-surface-elevated hover:bg-white/10 text-content-muted hover:text-white transition-colors"
                              title="View Application Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                          <Link to={`/developer/apps/${app._id}/edit`}>
                            <button
                              className="p-1.5 rounded-lg bg-surface-elevated hover:bg-white/10 text-content-muted hover:text-white transition-colors"
                              title="Edit Application"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <Boxes className="w-10 h-10 text-content-dim" />
              <div className="flex flex-col gap-1">
                <span className="font-heading font-bold text-content-primary">
                  No applications yet
                </span>
                <span className="text-xs text-content-muted">
                  Create your first Android application listing to get started.
                </span>
              </div>
              <Link to="/developer/apps/create" className="mt-2">
                <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                  Create Application
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* 5. QUICK ACTIONS SHORTCUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link
          to="/developer/apps/create"
          className="p-5 rounded-2xl bg-surface border border-white/10 hover:border-primary/50 transition-all group flex flex-col gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-sm text-content-primary group-hover:text-primary transition-colors">
            Create Application Listing
          </span>
          <span className="text-xs text-content-secondary leading-relaxed">
            Configure application metadata, features, and screenshots for review.
          </span>
        </Link>

        <Link
          to="/developer/analytics"
          className="p-5 rounded-2xl bg-surface border border-white/10 hover:border-accent-cyan/50 transition-all group flex flex-col gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 text-accent-cyan flex items-center justify-center group-hover:scale-110 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-sm text-content-primary group-hover:text-accent-cyan transition-colors">
            View Analytics Dashboard
          </span>
          <span className="text-xs text-content-secondary leading-relaxed">
            Inspect total downloads, listing views, and application ratings.
          </span>
        </Link>

        <Link
          to="/developer/profile"
          className="p-5 rounded-2xl bg-surface border border-white/10 hover:border-accent-purple/50 transition-all group flex flex-col gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-purple/10 text-accent-purple flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-sm text-content-primary group-hover:text-accent-purple transition-colors">
            Developer Organization Profile
          </span>
          <span className="text-xs text-content-secondary leading-relaxed">
            Update your organization name, portfolio, and verified website links.
          </span>
        </Link>
      </div>
    </div>
  );
};

export default DeveloperDashboardPage;
