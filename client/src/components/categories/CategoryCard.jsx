import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';

/**
 * Category Card for marketplace discovery
 */
export const CategoryCard = ({ category }) => {
  if (!category) return null;

  return (
    <Link
      to={`/explore?category=${category.slug}`}
      className="group relative flex flex-col justify-between p-6 rounded-2xl bg-surface border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-glow hover:-translate-y-1 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

      <div className="flex flex-col gap-3">
        <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:border-primary/40 transition-all">
          {category.icon || '📱'}
        </div>

        <div>
          <h3 className="text-base font-heading font-bold text-content-primary group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          <p className="text-xs text-content-secondary line-clamp-2 mt-1 leading-relaxed">
            {category.description || 'Explore top rated apps in this category.'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs font-mono text-content-dim">
        <span>{category.appCount || 0} applications</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:text-primary transition-all" />
      </div>
    </Link>
  );
};

export default CategoryCard;
