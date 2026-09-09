import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Folder, User, ArrowRight, TrendingUp } from 'lucide-react';

export const SearchSuggestions = ({ suggestions, onSelect, visible = false }) => {
  if (!visible) return null;

  const { apps = [], categories = [], developers = [], popular = [] } = suggestions;
  const hasResults =
    apps.length > 0 || categories.length > 0 || developers.length > 0 || popular.length > 0;

  if (!hasResults) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl p-2 animate-fadeIn">
      {/* 1. Direct App Matches */}
      {apps.length > 0 && (
        <div className="p-2 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 pb-1">
            Applications
          </div>
          {apps.map((app) => (
            <Link
              key={app.id}
              to={`/apps/${app.slug || app.id}`}
              onClick={() => onSelect && onSelect(app.name)}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-800/80 transition-colors group"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 p-0.5 flex-shrink-0 overflow-hidden">
                  {app.icon ? (
                    <img src={app.icon} alt={app.name} className="w-full h-full object-cover rounded-md" />
                  ) : (
                    <Search className="w-4 h-4 text-indigo-400 m-auto" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-sm font-semibold text-slate-100 group-hover:text-indigo-400 truncate">
                    {app.name}
                  </div>
                  <div className="text-[11px] text-slate-400">{app.category || 'Android App'}</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      )}

      {/* 2. Categories */}
      {categories.length > 0 && (
        <div className="p-2 border-t border-slate-800/60 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 pb-1">
            Categories
          </div>
          <div className="flex flex-wrap gap-1.5 px-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/search?category=${cat.slug}`}
                onClick={() => onSelect && onSelect(cat.name)}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              >
                <Folder className="w-3 h-3 text-indigo-400" />
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 3. Developers */}
      {developers.length > 0 && (
        <div className="p-2 border-t border-slate-800/60 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 pb-1">
            Developers
          </div>
          {developers.map((dev) => (
            <Link
              key={dev.id}
              to={`/developers/${dev.id}`}
              onClick={() => onSelect && onSelect(dev.name)}
              className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/80 transition-colors text-xs text-slate-300"
            >
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-slate-200">{dev.name}</span>
              <span className="text-slate-500">(@{dev.username})</span>
            </Link>
          ))}
        </div>
      )}

      {/* 4. Trending Searches */}
      {popular.length > 0 && (
        <div className="p-2 border-t border-slate-800/60 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 pb-1 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-amber-400" />
            <span>Popular Queries</span>
          </div>
          <div className="flex flex-wrap gap-1 px-2">
            {popular.map((term) => (
              <Link
                key={term}
                to={`/search?q=${encodeURIComponent(term)}`}
                onClick={() => onSelect && onSelect(term)}
                className="text-xs text-slate-400 hover:text-indigo-400 py-0.5 px-2 hover:bg-slate-800/60 rounded-md transition-colors"
              >
                #{term}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
