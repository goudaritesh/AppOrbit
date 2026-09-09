import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  DownloadCloud,
  Eye,
  Star,
  Boxes,
  Percent,
  RefreshCw,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageLoader from '../../components/common/PageLoader';
import SEOHead from '../../components/common/SEOHead';
import AnalyticsCard from '../../components/analytics/AnalyticsCard';
import AnalyticsChart from '../../components/analytics/AnalyticsChart';
import DateRangeSelector from '../../components/analytics/DateRangeSelector';
import DeveloperReplyModal from '../../components/reviews/DeveloperReplyModal';
import reviewsApi from '../../api/reviewsApi';
import analyticsApi from '../../api/analyticsApi';
import { formatNumber } from '../../utils/formatters';
import toast from 'react-hot-toast';

export const DeveloperAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReviewForReply, setSelectedReviewForReply] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsApi.getDeveloperOverview({ range });
      setData(res.data.data || null);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Unable to load developer analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const handleDeveloperReplySubmit = async ({ reviewId, message }) => {
    await reviewsApi.developerReply(reviewId, { message });
    toast.success('Response posted');
    fetchAnalytics();
  };

  if (loading && !data) return <PageLoader message="Loading developer analytics..." />;

  const topApps = data?.topApplications || [];
  const viewsOverTime = data?.viewsOverTime || [];
  const recentReviews = data?.recentReviews || [];

  return (
    <div className="flex flex-col gap-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <SEOHead title="Developer Analytics" description="Track app views, downloads, conversion, and reviews" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Developer Analytics & Growth
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time portfolio telemetry, user engagement, and download conversion.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <DateRangeSelector selectedRange={range} onChange={setRange} />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* 1. KEY PERFORMANCE INDICATORS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <AnalyticsCard
          title="Total Downloads"
          value={formatNumber(data?.totalDownloads || 0)}
          icon={DownloadCloud}
          change={data?.growthPercentage}
          isPositive={true}
          subtitle="Across published applications"
        />
        <AnalyticsCard
          title="Listing Impressions"
          value={formatNumber(data?.totalViews || 0)}
          icon={Eye}
          subtitle="Marketplace page visits"
        />
        <AnalyticsCard
          title="Download Conversion"
          value={data?.downloadConversion || '0.0%'}
          icon={Percent}
          subtitle="Downloads / Total views"
        />
        <AnalyticsCard
          title="Average Rating"
          value={Number(data?.averageRating || 0).toFixed(1)}
          icon={Star}
          subtitle={`${data?.totalReviews || 0} community reviews`}
        />
      </div>

      {/* 2. VIEWS VS DOWNLOADS ACTIVITY CHART */}
      <AnalyticsChart
        data={viewsOverTime}
        title="Marketplace Activity & Download Trends"
      />

      {/* 3. PERFORMANCE BREAKDOWN TABLE & RECENT REVIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Applications Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Top Applications</h2>
            <Link
              to="/developer/apps"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
            >
              <span>View All Apps</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
            {topApps.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Application</th>
                      <th className="py-3.5 px-4 font-semibold">Downloads</th>
                      <th className="py-3.5 px-4 font-semibold">Views</th>
                      <th className="py-3.5 px-4 font-semibold">Rating</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Deep Analytics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {topApps.map((app) => (
                      <tr key={app.id || app._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2.5">
                          {app.icon && (
                            <img src={app.icon} alt={app.name} className="w-6 h-6 rounded-lg object-cover" />
                          )}
                          <span>{app.name}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-400">
                          {formatNumber(app.downloads || 0)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-indigo-400">
                          {formatNumber(app.views || 0)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-amber-400">
                          {app.rating ? `${Number(app.rating).toFixed(1)} ★` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/developer/apps/${app.id || app._id}/analytics`}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            Funnel Telemetry →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                No active applications with metrics yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Reviews Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Recent Feedback</span>
          </h2>

          <div className="space-y-3">
            {recentReviews.length > 0 ? (
              recentReviews.map((rev) => (
                <div
                  key={rev._id}
                  className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{rev.user?.name || 'User'}</span>
                    <span className="text-amber-400 font-bold">{rev.rating} ★</span>
                  </div>
                  <p className="text-slate-300 line-clamp-2 italic">"{rev.comment}"</p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span className="truncate max-w-[120px]">{rev.application?.name}</span>
                    {!rev.developerReply?.message ? (
                      <button
                        type="button"
                        onClick={() => setSelectedReviewForReply(rev)}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Reply
                      </button>
                    ) : (
                      <span className="text-emerald-400">Replied ✓</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800 rounded-2xl">
                No reviews received yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Developer Reply Modal */}
      <DeveloperReplyModal
        isOpen={!!selectedReviewForReply}
        review={selectedReviewForReply}
        onClose={() => setSelectedReviewForReply(null)}
        onSubmit={handleDeveloperReplySubmit}
      />
    </div>
  );
};

export default DeveloperAnalyticsPage;
