import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import AppCard from '../../components/apps/AppCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/common/EmptyState';
import { getApps } from '../../api/appsApi';
import { getCategories } from '../../api/categoriesApi';
import useDebounce from '../../hooks/useDebounce';

const POPULAR_TECHNOLOGIES = [
  'All',
  'Kotlin',
  'Flutter',
  'React Native',
  'TensorFlow Lite',
  'Firebase',
  'SQLite',
  'MQTT',
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'recent', label: 'Recently Published' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'alphabetical', label: 'Alphabetical (A-Z)' },
];

export const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlPlatform = searchParams.get('platform') || '';
  const urlTech = searchParams.get('technology') || '';
  const urlVerified = searchParams.get('verified') === 'true';
  const urlSort = searchParams.get('sort') || 'popular';
  const urlPage = parseInt(searchParams.get('page'), 10) || 1;

  // Local filter states
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 350);

  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [selectedPlatform, setSelectedPlatform] = useState(urlPlatform);
  const [selectedTech, setSelectedTech] = useState(urlTech);
  const [verifiedOnly, setVerifiedOnly] = useState(urlVerified);
  const [sortBy, setSortBy] = useState(urlSort);
  const [page, setPage] = useState(urlPage);

  // Data states
  const [categories, setCategories] = useState([]);
  const [apps, setApps] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // 1. Fetch categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategories();
        setCategories(res.data?.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // 2. Synchronize URL search params
  const updateUrlParams = useCallback(
    (newParams) => {
      const params = new URLSearchParams();
      if (newParams.search) params.set('search', newParams.search);
      if (newParams.category) params.set('category', newParams.category);
      if (newParams.platform) params.set('platform', newParams.platform);
      if (newParams.technology && newParams.technology !== 'All')
        params.set('technology', newParams.technology);
      if (newParams.verified) params.set('verified', 'true');
      if (newParams.sort && newParams.sort !== 'popular') params.set('sort', newParams.sort);
      if (newParams.page > 1) params.set('page', newParams.page.toString());

      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  // 3. Fetch applications based on current filter state
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 12,
        sort: sortBy,
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (selectedPlatform) params.platform = selectedPlatform;
      if (selectedTech && selectedTech !== 'All') params.technology = selectedTech;
      if (verifiedOnly) params.verified = 'true';

      const res = await getApps(params);
      setApps(res.data?.apps || []);
      setPagination(res.data?.pagination || { page, limit: 12, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch apps:', err);
      setError('Unable to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, selectedPlatform, selectedTech, verifiedOnly, sortBy, page]);

  // Trigger fetch and sync URL whenever filter state changes
  useEffect(() => {
    fetchApplications();
    updateUrlParams({
      search: debouncedSearch,
      category: selectedCategory,
      platform: selectedPlatform,
      technology: selectedTech,
      verified: verifiedOnly,
      sort: sortBy,
      page,
    });
  }, [
    debouncedSearch,
    selectedCategory,
    selectedPlatform,
    selectedTech,
    verifiedOnly,
    sortBy,
    page,
    fetchApplications,
    updateUrlParams,
  ]);

  // Reset page when any filter criteria changes
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSelectedCategory('');
    setSelectedPlatform('');
    setSelectedTech('');
    setVerifiedOnly(false);
    setSortBy('popular');
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    Boolean(selectedCategory) ||
    Boolean(selectedPlatform) ||
    Boolean(selectedTech && selectedTech !== 'All') ||
    verifiedOnly;

  return (
    <div className="max-w-content-max mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[85vh]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-content-primary tracking-tight">
            Explore Android Applications
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1 leading-relaxed">
            Discover vetted native utilities, productivity apps, and tools built by independent developers.
          </p>
        </div>

        {/* Mobile Filter Toggle & Sort Dropdown */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileFilterOpen(true)}
            icon={<SlidersHorizontal className="w-4 h-4" />}
          >
            Filters {hasActiveFilters && '(Active)'}
          </Button>

          {/* Sort Selection */}
          <div className="relative flex items-center">
            <ArrowUpDown className="absolute left-3 w-4 h-4 text-content-muted pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => handleFilterChange(setSortBy, e.target.value)}
              className="pl-9 pr-8 py-2 text-xs font-medium rounded-xl bg-surface border border-white/10 text-content-primary focus:outline-none focus:border-primary cursor-pointer appearance-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface text-content-primary">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + App Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* DESKTOP FILTER SIDEBAR */}
        <aside className="hidden md:flex flex-col gap-6 p-6 rounded-2xl bg-surface border border-white/10 h-fit sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-2 text-sm font-heading font-bold text-content-primary">
              <Filter className="w-4 h-4 text-primary" />
              <span>Filters</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-primary hover:text-accent-cyan transition-colors"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase text-content-dim">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleFilterChange(setSearchInput, e.target.value)}
                placeholder="Name, tech, tag..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface-elevated border border-white/10 text-content-primary placeholder:text-content-muted focus:outline-none focus:border-primary"
              />
              {searchInput && (
                <button
                  onClick={() => handleFilterChange(setSearchInput, '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase text-content-dim">Category</label>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => handleFilterChange(setSelectedCategory, '')}
                className={`text-left text-xs px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  !selectedCategory
                    ? 'bg-primary/20 text-primary font-bold'
                    : 'text-content-secondary hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>All Categories</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleFilterChange(setSelectedCategory, cat.slug)}
                  className={`text-left text-xs px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    selectedCategory === cat.slug
                      ? 'bg-primary/20 text-primary font-bold'
                      : 'text-content-secondary hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="truncate">
                    {cat.icon} {cat.name}
                  </span>
                  <span className="text-[10px] font-mono text-content-dim">{cat.appCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Technology Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase text-content-dim">Technology</label>
            <select
              value={selectedTech}
              onChange={(e) => handleFilterChange(setSelectedTech, e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-surface-elevated border border-white/10 text-content-primary focus:outline-none focus:border-primary cursor-pointer"
            >
              {POPULAR_TECHNOLOGIES.map((tech) => (
                <option key={tech} value={tech === 'All' ? '' : tech} className="bg-surface">
                  {tech}
                </option>
              ))}
            </select>
          </div>

          {/* Platform Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase text-content-dim">Platform</label>
            <div className="grid grid-cols-2 gap-1.5">
              {['', 'ANDROID'].map((plat) => (
                <button
                  key={plat}
                  onClick={() => handleFilterChange(setSelectedPlatform, plat)}
                  className={`py-1.5 text-xs rounded-lg font-mono border transition-colors ${
                    selectedPlatform === plat
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-elevated text-content-secondary border-white/5 hover:border-white/20'
                  }`}
                >
                  {plat || 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Developer Checkbox */}
          <div className="pt-2 border-t border-white/5">
            <label className="flex items-center gap-2 text-xs text-content-secondary hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => handleFilterChange(setVerifiedOnly, e.target.checked)}
                className="rounded border-white/20 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface"
              />
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-cyan" />
                <span>Verified Apps Only</span>
              </span>
            </label>
          </div>
        </aside>

        {/* MOBILE FILTER MODAL / DRAWER */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm md:hidden">
            <div className="w-full max-w-md bg-surface border border-white/10 rounded-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-heading font-bold text-base text-content-primary">
                  Filter Applications
                </h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-lg bg-white/5 text-content-muted hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-content-dim">Search</label>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleFilterChange(setSearchInput, e.target.value)}
                  placeholder="Keywords..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface-elevated border border-white/10 text-content-primary"
                />
              </div>

              {/* Mobile Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-content-dim">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleFilterChange(setSelectedCategory, e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-surface-elevated border border-white/10 text-content-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Tech */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-content-dim">Technology</label>
                <select
                  value={selectedTech}
                  onChange={(e) => handleFilterChange(setSelectedTech, e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-surface-elevated border border-white/10 text-content-primary"
                >
                  {POPULAR_TECHNOLOGIES.map((tech) => (
                    <option key={tech} value={tech === 'All' ? '' : tech}>
                      {tech}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verified Toggle */}
              <label className="flex items-center gap-2 text-xs text-content-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => handleFilterChange(setVerifiedOnly, e.target.checked)}
                  className="rounded border-white/20 bg-surface-elevated text-primary"
                />
                <span>Verified Apps Only</span>
              </label>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    clearAllFilters();
                    setIsMobileFilterOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsMobileFilterOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* APPLICATION GRID & RESULTS */}
        <main className="md:col-span-3 flex flex-col gap-6">
          {/* Active Filter Badges & Count */}
          <div className="flex items-center justify-between text-xs font-mono text-content-dim">
            <span>
              Showing <strong className="text-content-primary">{apps.length}</strong> of{' '}
              <strong className="text-content-primary">{pagination.total}</strong> applications
            </span>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-primary hover:text-accent-cyan transition-colors underline"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose flex items-center justify-between text-sm">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchApplications}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Loading Skeleton Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
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
          ) : apps.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {apps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No applications found"
              description="We couldn't find any applications matching your current search or filter criteria."
              actionLabel="Clear All Filters"
              onAction={clearAllFilters}
            />
          )}

          {/* PAGINATION CONTROLS */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-8 pb-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>

              <div className="text-xs font-mono text-content-dim px-3">
                Page <strong className="text-content-primary">{pagination.page}</strong> of{' '}
                <strong className="text-content-primary">{pagination.totalPages}</strong>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ExplorePage;
