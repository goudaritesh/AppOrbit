import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import SearchBar from '../../components/search/SearchBar';
import SearchFilters from '../../components/search/SearchFilters';
import AppCard from '../../components/apps/AppCard';
import SEOHead from '../../components/common/SEOHead';
import searchApi from '../../api/searchApi';

export const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const platform = searchParams.get('platform') || '';
  const minRating = searchParams.get('minRating') || '';
  const sort = searchParams.get('sort') || 'RELEVANCE';
  const page = parseInt(searchParams.get('page'), 10) || 1;

  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [popularApps, setPopularApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [q, category, platform, minRating, sort, page]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await searchApi.search({
        q,
        category,
        platform,
        minRating,
        sort,
        page,
        limit: 12,
      });
      setResults(res.data.data.results || []);
      setPagination(res.data.data.pagination);

      // If no results, load popular apps as suggestions
      if ((res.data.data.results || []).length === 0) {
        const popRes = await searchApi.getPopularApps({ limit: 4 });
        setPopularApps(popRes.data.data || []);
      }
    } catch (err) {
      console.error('Search query failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val) {
        nextParams.set(key, val);
      } else {
        nextParams.delete(key);
      }
    });
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    const nextParams = new URLSearchParams();
    if (q) nextParams.set('q', q);
    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(newPage));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFilterCount = [category, platform, minRating].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SEOHead
        title={q ? `Search results for "${q}"` : 'Discover Applications'}
        description={`Explore verified Android applications matching ${q || 'your interests'} on AppOrbit.`}
      />

      {/* Top Search Bar & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3">
            <span>Marketplace Search</span>
            {q && (
              <span className="text-sm font-normal px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                "{q}"
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {loading
              ? 'Searching catalog...'
              : `Found ${pagination.total} application${pagination.total === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="w-full md:w-auto">
          <SearchBar placeholder="Search apps, developers..." />
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {activeFilterCount > 0 && (
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1">Active filters:</span>
          {category && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
              <span>Category: {category}</span>
              <button
                type="button"
                onClick={() => handleFilterChange({ category: '' })}
                className="hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {minRating && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
              <span>Rating: {minRating}★+</span>
              <button
                type="button"
                onClick={() => handleFilterChange({ minRating: '' })}
                className="hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {platform && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
              <span>Platform: {platform}</span>
              <button
                type="button"
                onClick={() => handleFilterChange({ platform: '' })}
                className="hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-indigo-400 hover:underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Mobile Filters Trigger */}
      <div className="md:hidden flex justify-end">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200"
        >
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          <span>Filters ({activeFilterCount})</span>
        </button>
      </div>

      {/* Content Layout: Filter Sidebar + App Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <div className={`md:block ${mobileFiltersOpen ? 'block' : 'hidden'} md:col-span-1`}>
          <SearchFilters
            filters={{ category, platform, minRating, sort }}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* Results Grid */}
        <div className="md:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-72 bg-slate-900/60 border border-slate-800 rounded-3xl animate-pulse"
                />
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((app) => (
                  <AppCard key={app._id} app={app} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total results)
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Smart Empty State */
            <div className="space-y-8">
              <div className="py-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500 shadow-inner">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white">No applications found</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  We couldn't find any applications matching your query or filter criteria. Try adjusting your search term, checking for typos, or clearing filters.
                </p>
                <div className="flex items-center justify-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Reset All Filters
                  </button>
                  <Link
                    to="/categories"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Browse Categories
                  </Link>
                </div>
              </div>

              {/* Popular Applications Suggestions */}
              {popularApps.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm font-bold text-white">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Popular on AppOrbit</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {popularApps.map((app) => (
                      <AppCard key={app._id} app={app} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
