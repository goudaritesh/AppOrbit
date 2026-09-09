import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSuggestions, clearSuggestions } from '../../store/slices/searchSlice';
import SearchSuggestions from './SearchSuggestions';

export const SearchBar = ({ placeholder = 'Search apps, categories, developers...', className = '' }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { suggestions, suggestionsLoading } = useSelector((state) => state.search);

  // Debounced autocomplete (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        dispatch(fetchSuggestions(query.trim()));
        setIsOpen(true);
      } else {
        dispatch(clearSuggestions());
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, dispatch]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelectSuggestion = (selectedTerm) => {
    setQuery(selectedTerm);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-xl ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
          {suggestionsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner transition-all duration-150"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              dispatch(clearSuggestions());
              setIsOpen(false);
            }}
            className="absolute right-3 p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      <SearchSuggestions
        suggestions={suggestions}
        visible={isOpen}
        onSelect={handleSelectSuggestion}
      />
    </div>
  );
};

export default SearchBar;
