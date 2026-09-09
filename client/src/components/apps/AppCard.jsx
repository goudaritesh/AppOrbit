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

  const version =
    app.currentVersion?.version || app.currentVersion?.versionName || '1.0.0';
  const devUsername = app.developer?.username || app.developer?.id || app.developer?._id;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl bg-surface border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-glow hover:-translate-y-1 overflow-hidden ${
        featured ? 'ring-1 ring-primary/30' : ''
      }`}
    >
      {/* Top Background Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

      <div className="p-5 flex flex-col gap-3.5">
        {/* Header: Icon, Name, Developer */}
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
            <Link
              to={`/apps/${app.slug}`}
              className="font-heading font-bold text-base text-content-primary hover:text-primary transition-colors truncate"
            >
              {app.name}
            </Link>

            {/* Developer link */}
            <div className="flex items-center gap-1.5 text-xs text-content-secondary mt-0.5 truncate">
              {devUsername ? (
                <Link
                  to={`/developers/${devUsername}`}
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

            {/* Category • Version */}
            <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-content-muted">
              <span className="text-accent-cyan font-medium">{categoryName}</span>
              <span>•</span>
              <span className="text-content-dim">v{version}</span>
            </div>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-xs text-content-secondary line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {app.shortDescription}
        </p>

        {/* Metrics & Security Badge */}
        <div className="flex items-center justify-between pt-1 text-xs font-mono">
          <div className="flex items-center gap-3">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-content-primary font-bold">{app.ratingAverage || 0}</span>
              {app.ratingCount > 0 && <span className="text-content-dim">({formatNumber(app.ratingCount)})</span>}
            </div>

            {/* Downloads */}
            <div className="flex items-center gap-1">
              <DownloadCloud className="w-3.5 h-3.5 text-accent-cyan" />
              <span>{formatNumber(app.downloadCount || 0)}</span>
            </div>
          </div>

          {/* Security Badge */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
            🛡️ Checked
          </span>
        </div>
      </div>

      {/* Action footer */}
      <div className="px-5 py-2.5 bg-surface-elevated/40 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {app.platform && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-content-muted border border-white/5">
              {app.platform}
            </span>
          )}
        </div>

        <Link
          to={`/apps/${app.slug}`}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary transition-all"
        >
          <span>View App</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default AppCard;
