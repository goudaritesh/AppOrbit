import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Eye,
  Download,
  Percent,
  Star,
  ArrowLeft,
  Calendar,
  Layers,
  Globe,
  Share2,
} from 'lucide-react';
import analyticsApi from '../../api/analyticsApi';
import AnalyticsCard from '../../components/analytics/AnalyticsCard';
import AnalyticsChart from '../../components/analytics/AnalyticsChart';
import DateRangeSelector from '../../components/analytics/DateRangeSelector';
import SEOHead from '../../components/common/SEOHead';
import toast from 'react-hot-toast';

export const DeveloperAppAnalyticsPage = () => {
  const { appId } = useParams();
  const [data, setData] = useState(null);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppAnalytics();
  }, [appId, range]);

  const fetchAppAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getAppAnalytics(appId, { range });
      setData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch application analytics');
    } finally {
      setLoading(false);
    }
  };

  const app = data?.application;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SEOHead title={app?.name ? `${app.name} Analytics` : 'App Analytics'} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-4">
          <Link
            to="/developer/apps"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
              {app?.icon ? (
                <img src={app.icon} alt={app.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Layers className="w-6 h-6 text-indigo-400" />
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {app?.name || 'Application Analytics'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Telemetry & Conversion Funnel</p>
            </div>
          </div>
        </div>

        <DateRangeSelector selectedRange={range} onChange={setRange} />
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900/60 border border-slate-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard
              title="Page Views"
              value={data.views.toLocaleString()}
              icon={Eye}
              subtitle={`${data.uniqueVisitors.toLocaleString()} unique visitors`}
            />
            <AnalyticsCard
              title="Total Downloads"
              value={data.downloads.toLocaleString()}
              icon={Download}
              subtitle="Verified APK downloads"
            />
            <AnalyticsCard
              title="Conversion Rate"
              value={data.conversionRate}
              icon={Percent}
              change="+3.2%"
              isPositive={true}
              subtitle="Downloads / Page views"
            />
            <AnalyticsCard
              title="Average Rating"
              value={Number(app?.ratingAverage || 0).toFixed(1)}
              icon={Star}
              subtitle={`${app?.ratingCount || 0} user ratings`}
            />
          </div>

          {/* Activity Timeline Chart */}
          <AnalyticsChart data={data.timeline} title="Views vs. Downloads Timeline" />

          {/* Version Breakdown & Traffic Sources Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Version Download Performance Table */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Version Performance</span>
                </h3>
              </div>

              {data.versionPerformance?.length > 0 ? (
                <div className="divide-y divide-slate-800 text-xs">
                  {data.versionPerformance.map((v) => (
                    <div key={v.version} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-200">Version {v.version}</span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Status: <span className="text-emerald-400">{v.status}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">{v.downloads.toLocaleString()}</span>
                        <div className="text-[11px] text-slate-500 mt-0.5">downloads</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No versions recorded</p>
              )}
            </div>

            {/* Traffic Sources Breakdown */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Traffic Sources</span>
              </h3>

              <div className="space-y-3 pt-2 text-xs">
                {Object.entries(data.trafficSources || {}).map(([source, count]) => {
                  const total = Object.values(data.trafficSources).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={source} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="capitalize text-slate-300">{source}</span>
                        <span className="text-slate-400">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DeveloperAppAnalyticsPage;
