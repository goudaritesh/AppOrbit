import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  DownloadCloud,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import Badge from '../ui/Badge';
import { formatNumber } from '../../utils/formatters';

/**
 * Reusable AppCard component for marketplace grids
 */
export const AppCard = ({ app, featured = false }) => {
  const [imageError, setImageError] = useState(false);

  if (!app) return null;

  const categoryName = app.category?.name || app.category || 'General';
  const developerName = app.developer?.name || 'Developer';
  const isVerified =
    app.verificationStatus === 'VERIFIED' || app.developer?.verificationStatus === 'VERIFIED';

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl bg-surface border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-glow hover:-translate-y-1 overflow-hidden ${
        featured ? 'ring-1 ring-primary/30' : ''
      }`}
    >
      {/* Top Background Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

      <div className="p-5 flex flex-col gap-4">
        {/* Header: Icon, Name, Category & Platform */}
        <div className="flex items-start gap-3.5">
          {/* App Icon */}
          <div className="w-14 h-14 rounded-xl bg-surface-elevated border border-white/10 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm overflow-hidden group-hover:border-primary/40 transition-colors">
            {app.icon && !imageError ? (
              <img
                src={app.icon}
                alt={app.name}
                loading="lazy"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-heading font-bold text-primary text-xl">
                {app.name ? app.name.charAt(0).toUpperCase() : 'A'}
              </span>
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <Link
                to={`/apps/${app.slug}`}
                className="font-heading font-bold text-base text-content-primary hover:text-primary transition-colors truncate"
              >
                {app.name}
              </Link>
            </div>

            {/* Developer link */}
            <div className="flex items-center gap-1.5 text-xs text-content-secondary mt-0.5 truncate">
              {app.developer?.id ? (
                <Link
                  to={`/developers/${app.developer.id}`}
                  className="hover:text-white transition-colors truncate"
                >
                  {developerName}
                </Link>
              ) : (
                <span className="truncate">{developerName}</span>
              )}
              {isVerified && (
                <CheckCircle2
                  className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0"
                  title="Verified Developer"
                />
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Badge variant="neutral" size="sm" dot={false}>
                {categoryName}
              </Badge>
              {app.platform && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-content-muted border border-white/5">
                  {app.platform}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-xs text-content-secondary line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {app.shortDescription}
        </p>

        {/* Technologies Tags */}
        {app.technologies && app.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {app.technologies.slice(0, 3).map((tech, idx) => (
              <span
                key={idx}
                className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-elevated text-content-muted border border-white/5"
              >
                {tech}
              </span>
            ))}
            {app.technologies.length > 3 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-content-dim">
                +{app.technologies.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Metrics & Action */}
      <div className="px-5 py-3 bg-surface-elevated/40 border-t border-white/5 flex items-center justify-between text-xs font-mono text-content-dim">
        <div className="flex items-center gap-3">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-content-primary font-bold">{app.ratingAverage || 0}</span>
            {app.ratingCount > 0 && <span>({formatNumber(app.ratingCount)})</span>}
          </div>

          {/* Downloads */}
          <div className="flex items-center gap-1">
            <DownloadCloud className="w-3.5 h-3.5 text-accent-cyan" />
            <span>{formatNumber(app.downloadCount || 0)}</span>
          </div>
        </div>

        {/* Details Link CTA */}
        <Link
          to={`/apps/${app.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-accent-cyan transition-colors"
        >
          <span>Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default AppCard;
