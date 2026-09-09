import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  DownloadCloud,
  Sparkles,
  Layers,
  Terminal,
  Star,
  RefreshCw,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import AppCard from '../../components/apps/AppCard';
import CategoryCard from '../../components/categories/CategoryCard';
import SearchBar from '../../components/search/SearchBar';
import SEOHead from '../../components/common/SEOHead';
import { getFeaturedApps, getPopularApps, getRecentApps } from '../../api/appsApi';
import { getCategories } from '../../api/categoriesApi';

export const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // State
  const [featuredApps, setFeaturedApps] = useState([]);
  const [popularApps, setPopularApps] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [featRes, popRes, recRes, catRes] = await Promise.all([
        getFeaturedApps(6),
        getPopularApps(6),
        getRecentApps(6),
        getCategories(),
      ]);

      setFeaturedApps(featRes.data?.apps || []);
      setPopularApps(popRes.data?.apps || []);
      setRecentApps(recRes.data?.apps || []);
      setCategories(catRes.data?.categories || []);
    } catch (err) {
      console.error('Failed to load marketplace home data:', err);
      setError('Unable to connect to the marketplace. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  // Skeleton Card Loader
  const renderSkeletons = (count = 6) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-surface border border-white/5 p-5 animate-pulse flex flex-col gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-white/5" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
            </div>
          </div>
          <div className="h-3 bg-white/5 rounded w-full" />
          <div className="h-3 bg-white/5 rounded w-2/3" />
          <div className="pt-4 border-t border-white/5 flex justify-between">
            <div className="h-3 bg-white/5 rounded w-1/4" />
            <div className="h-3 bg-white/5 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col w-full min-h-screen">
      <SEOHead
        title="Discover & Download Verified Android Apps"
        description="AppOrbit is the next-generation secure Android app marketplace. Explore verified applications, read authentic reviews, and download safely."
      />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-secondary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-elevated border border-white/10 text-xs font-mono text-content-secondary mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Next-Gen Android APK Distribution Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-heading text-content-primary leading-[1.15] mb-6">
            Discover Amazing <span className="brand-gradient-text">Android Applications</span>
          </h1>

          <p className="text-base sm:text-lg text-content-secondary max-w-2xl leading-relaxed mb-10">
            Explore innovative applications created by independent developers and discover new tools
            for work, learning, productivity, health, and everyday life.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 w-full sm:w-auto">
            <Link to="/explore" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Explore Apps
              </Button>
            </Link>
            <Link to="/developer" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                icon={<Terminal className="w-4 h-4" />}
              >
                Publish Your App
              </Button>
            </Link>
          </div>

          {/* Prominent Search Bar with Autocomplete Suggestions */}
          <div className="w-full max-w-2xl">
            <SearchBar placeholder="Search apps, technologies, categories, developers..." />
          </div>
        </div>
      </section>

      {/* Global Error Banner if API call fails */}
      {error && (
        <div className="max-w-content-max mx-auto px-4 sm:px-6 lg:px-8 mt-8 w-full">
          <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose flex items-center justify-between text-sm">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHomeData}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* 2. FEATURED APPLICATIONS SECTION */}
      <section className="py-16 md:py-20 max-w-content-max mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Handpicked by Curators</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-content-primary">
              Featured Applications
            </h2>
          </div>
          <Link to="/explore">
            <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              View All Apps
            </Button>
          </Link>
        </div>

        {loading ? (
          renderSkeletons(6)
        ) : featuredApps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredApps.map((app) => (
              <AppCard key={app.id} app={app} featured />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-content-muted">
            No featured applications available currently.
          </div>
        )}
      </section>

      {/* 3. BROWSE BY CATEGORY */}
      <section className="py-16 bg-surface-elevated/20 border-y border-white/5">
        <div className="max-w-content-max mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-accent-cyan uppercase tracking-wider mb-2">
                <Layers className="w-4 h-4" />
                <span>Ecosystem Directories</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-content-primary">
                Browse by Category
              </h2>
            </div>
            <Link to="/categories">
              <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                All Categories
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-surface border border-white/5 animate-pulse h-36"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {categories.slice(0, 8).map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. POPULAR APPLICATIONS */}
      <section className="py-16 md:py-20 max-w-content-max mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-2">
              <Star className="w-4 h-4" />
              <span>Community Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-content-primary">
              Popular Applications
            </h2>
          </div>
          <Link to="/explore?sort=popular">
            <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              Explore Popular
            </Button>
          </Link>
        </div>

        {loading ? (
          renderSkeletons(6)
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </section>

      {/* 5. RECENTLY PUBLISHED */}
      <section className="py-16 bg-surface-elevated/20 border-y border-white/5">
        <div className="max-w-content-max mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-accent-emerald uppercase tracking-wider mb-2">
                <DownloadCloud className="w-4 h-4" />
                <span>Fresh Releases</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-content-primary">
                Recently Published
              </h2>
            </div>
            <Link to="/explore?sort=recent">
              <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                Explore Recent
              </Button>
            </Link>
          </div>

          {loading ? (
            renderSkeletons(6)
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. PLATFORM TRUST & ARCHITECTURE SECTION */}
      <section className="py-20 max-w-content-max mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-3xl bg-surface border border-white/10 p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-content-primary mb-4">
              Building Open & Transparent Android Distribution
            </h2>
            <p className="text-content-secondary text-sm sm:text-base leading-relaxed">
              AppOrbit provides direct distribution channels between developers and users with full
              visibility into build versions, verified signatures, and open source repositories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-content-primary">
                Developer Identity Verification
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Developers undergo identity verification with public developer profiles, linking
                directly to their official web domains and GitHub repositories.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-content-primary">
                Cryptographic Signature Tracking
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Every release includes transparent release notes, version codes, minimum OS
                requirements, and package file size indicators.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-content-primary">
                Developer-First Ecosystem
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Direct distribution without algorithmic suppression. Build your application with
                modern toolchains like Flutter, Kotlin, or React Native.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
