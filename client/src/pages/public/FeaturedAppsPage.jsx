import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  DownloadCloud,
  Flame,
  Sparkles,
  Award,
  GraduationCap,
  Zap,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import AppCard from '../../components/apps/AppCard';
import SEOHead from '../../components/common/SEOHead';
import Button from '../../components/ui/Button';
import { getFeaturedApps, getPopularApps, getRecentApps } from '../../api/appsApi';
import searchApi from '../../api/searchApi';

const SECTIONS = [
  {
    id: 'featured',
    label: '🌟 Featured Apps',
    description: 'Editor-curated picks — the best of AppOrbit',
    gradientFrom: 'from-primary/10',
    gradientTo: 'to-accent-cyan/5',
    borderColor: 'border-primary/20',
    badgeColor: 'bg-primary/20 text-primary border-primary/30',
  },
  {
    id: 'trending',
    label: '🔥 Trending Now',
    description: 'Apps gaining momentum with the community',
    gradientFrom: 'from-orange-500/10',
    gradientTo: 'to-amber-500/5',
    borderColor: 'border-orange-500/20',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  {
    id: 'topRated',
    label: '⭐ Top Rated',
    description: 'Highest-rated apps by verified users',
    gradientFrom: 'from-amber-500/10',
    gradientTo: 'to-yellow-500/5',
    borderColor: 'border-amber-500/20',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  {
    id: 'newReleases',
    label: '🆕 New Releases',
    description: 'Fresh apps recently published to AppOrbit',
    gradientFrom: 'from-emerald-500/10',
    gradientTo: 'to-cyan-500/5',
    borderColor: 'border-emerald-500/20',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
];

const SectionSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="h-40 rounded-2xl bg-surface-low border border-white/5" />
    ))}
  </div>
);

const AppSection = ({ section, apps, loading }) => {
  if (loading) return <SectionSkeleton />;

  if (!apps || apps.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-content-muted text-sm">
        No apps in this section yet — check back soon!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {apps.map((app) => (
        <AppCard key={app._id || app.id} app={app} featured={section.id === 'featured'} />
      ))}
    </div>
  );
};

export const FeaturedAppsPage = () => {
  const [featuredApps, setFeaturedApps] = useState([]);
  const [trendingApps, setTrendingApps] = useState([]);
  const [topRatedApps, setTopRatedApps] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('featured');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [featRes, trendRes, topRes, newRes] = await Promise.all([
        getFeaturedApps(12).catch(() => ({ data: { data: [] } })),
        searchApi.getTrendingApps({ limit: 12 }).catch(() => ({ data: { data: [] } })),
        getPopularApps(12).catch(() => ({ data: { data: [] } })),
        getRecentApps(12).catch(() => ({ data: { data: [] } })),
      ]);

      const extract = (res) =>
        res?.data?.data?.apps ||
        res?.data?.data ||
        res?.data?.apps ||
        res?.data ||
        [];

      setFeaturedApps(extract(featRes));
      setTrendingApps(extract(trendRes));
      setTopRatedApps(extract(topRes));
      setNewReleases(extract(newRes));
    } catch (err) {
      console.error('Failed to load featured apps:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAppsForSection = (sectionId) => {
    switch (sectionId) {
      case 'featured':    return featuredApps;
      case 'trending':    return trendingApps;
      case 'topRated':    return topRatedApps;
      case 'newReleases': return newReleases;
      default:            return [];
    }
  };

  const activeConfig = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  return (
    <>
      <SEOHead
        title="Featured & Trending Apps"
        description="Discover the best Android apps on AppOrbit — editor picks, trending community favorites, top-rated, and brand new releases from indie developers."
        canonicalUrl={`${window.location.origin}/featured`}
      />

      <div className="min-h-screen bg-background pb-16">
        {/* Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-background via-surface to-background border-b border-white/5">
          {/* Decorative glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent-cyan/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative">
            {/* Badge */}
            <div className="flex justify-center mb-5">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Curated by the AppOrbit Team
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-center text-content-primary font-heading tracking-tight mb-4">
              Featured & Trending
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-cyan">
                Android Apps
              </span>
            </h1>

            <p className="text-center text-content-muted text-base sm:text-lg max-w-2xl mx-auto mb-10">
              Discover hand-picked apps from talented indie developers. From student experiments to
              production-ready tools — AppOrbit has it all.
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
              {[
                { icon: <Award className="w-4 h-4 text-primary" />, label: 'Editor Picks', value: featuredApps.length || '—' },
                { icon: <Star className="w-4 h-4 text-amber-400" />, label: 'Top Rated', value: topRatedApps.length || '—' },
                { icon: <DownloadCloud className="w-4 h-4 text-emerald-400" />, label: 'New This Week', value: newReleases.length || '—' },
                { icon: <CheckCircle2 className="w-4 h-4 text-accent-cyan" />, label: 'All Verified', value: '100%' },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-surface-low border border-white/5">{stat.icon}</div>
                  <div>
                    <div className="text-lg font-black text-content-primary font-mono">{stat.value}</div>
                    <div className="text-xs text-content-muted">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          {/* Section Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  activeSection === section.id
                    ? `${section.badgeColor} border shadow-sm`
                    : 'bg-surface-low text-content-muted border-white/5 hover:border-white/10 hover:text-content-primary'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Active Section */}
          <div className={`rounded-2xl border p-6 bg-gradient-to-br ${activeConfig.gradientFrom} ${activeConfig.gradientTo} ${activeConfig.borderColor} mb-10`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-content-primary">{activeConfig.label}</h2>
                <p className="text-xs text-content-muted mt-0.5">{activeConfig.description}</p>
              </div>
              <Link
                to={`/explore?filter=${activeSection}`}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-accent-cyan transition-colors"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <AppSection
              section={activeConfig}
              apps={getAppsForSection(activeSection)}
              loading={loading}
            />
          </div>

          {/* All Other Sections in Compact Form */}
          {SECTIONS.filter((s) => s.id !== activeSection).map((section) => {
            const apps = getAppsForSection(section.id);
            const preview = apps.slice(0, 3);
            return (
              <div key={section.id} className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-content-primary">{section.label}</h3>
                    <p className="text-xs text-content-muted">{section.description}</p>
                  </div>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${section.badgeColor} transition-all hover:opacity-90`}
                  >
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-36 rounded-2xl bg-surface-low border border-white/5" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {preview.map((app) => (
                      <AppCard key={app._id || app.id} app={app} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* CTA */}
          <div className="mt-10 py-12 rounded-2xl border border-white/5 bg-surface-low text-center">
            <h3 className="text-xl font-bold text-content-primary mb-2">
              Can't find what you're looking for?
            </h3>
            <p className="text-sm text-content-muted mb-6">
              Browse the full AppOrbit catalog with advanced filtering, search, and category discovery.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/explore">
                <Button variant="primary" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Browse All Apps
                </Button>
              </Link>
              <Link to="/categories">
                <Button variant="outline" className="flex items-center gap-2">
                  View Categories
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeaturedAppsPage;
