import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import CategoryCard from '../../components/categories/CategoryCard';
import Button from '../../components/ui/Button';
import PageLoader from '../../components/common/PageLoader';
import { getCategories } from '../../api/categoriesApi';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCategories();
      setCategories(res.data?.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Unable to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Browse Categories — AppOrbit';
    fetchCategories();
  }, []);

  return (
    <div className="max-w-content-max mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-10">
        <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>Ecosystem Catalog</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-content-primary tracking-tight">
          Application Categories
        </h1>
        <p className="text-xs sm:text-sm text-content-muted max-w-2xl leading-relaxed">
          Browse specialized Android applications grouped by utility, domain, and platform capabilities.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose flex items-center justify-between text-sm">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCategories}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-surface border border-white/5 animate-pulse h-44"
            />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-content-muted">
          No categories found.
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
