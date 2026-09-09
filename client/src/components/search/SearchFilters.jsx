import React, { useEffect, useState } from 'react';
import { Filter, RotateCcw, Star } from 'lucide-react';
import categoriesApi from '../../api/categoriesApi';

export const SearchFilters = ({ filters, onFilterChange, onReset }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesApi.getCategories();
        setCategories(res.data.data.categories || []);
      } catch (err) {
        console.error('Failed to load categories for search filter:', err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span>Filter Applications</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-indigo-400 flex items-center space-x-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Category
        </label>
        <select
          value={filters.category || ''}
          onChange={(e) => onFilterChange({ category: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.slug || cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Minimum Rating */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Minimum Rating
        </label>
        <div className="space-y-1.5">
          {[
            { label: 'Any Rating', value: '' },
            { label: '4.5★ & higher', value: '4.5' },
            { label: '4.0★ & higher', value: '4' },
            { label: '3.0★ & higher', value: '3' },
          ].map((item) => (
            <label
              key={item.value}
              className="flex items-center space-x-2.5 text-xs text-slate-300 cursor-pointer hover:text-white"
            >
              <input
                type="radio"
                name="minRating"
                checked={filters.minRating === item.value}
                onChange={() => onFilterChange({ minRating: item.value })}
                className="text-indigo-500 bg-slate-800 border-slate-700 focus:ring-0"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Platform */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Platform
        </label>
        <select
          value={filters.platform || ''}
          onChange={(e) => onFilterChange({ platform: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Platforms</option>
          <option value="ANDROID">Android</option>
          <option value="WEB">Web App</option>
          <option value="IOS">iOS</option>
        </select>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Sort Order
        </label>
        <select
          value={filters.sort || 'RELEVANCE'}
          onChange={(e) => onFilterChange({ sort: e.target.value })}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl focus:outline-none focus:border-indigo-500"
        >
          <option value="RELEVANCE">Best Match / Relevance</option>
          <option value="POPULARITY">Most Popular</option>
          <option value="RATING">Highest Rated</option>
          <option value="NEWEST">Newest Releases</option>
          <option value="MOST_DOWNLOADED">Most Downloaded</option>
        </select>
      </div>
    </div>
  );
};

export default SearchFilters;
