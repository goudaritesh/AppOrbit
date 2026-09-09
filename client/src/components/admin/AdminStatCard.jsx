import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * Reusable Admin KPI Metric Card
 */
export const AdminStatCard = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon,
  loading = false,
  onClick,
}) => {
  if (loading) {
    return (
      <div className="glass-panel p-5 rounded-2xl border border-white/10 animate-pulse">
        <div className="h-4 w-24 bg-white/10 rounded mb-3" />
        <div className="h-8 w-16 bg-white/20 rounded mb-2" />
        <div className="h-3 w-32 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-white/20 hover:scale-[1.01]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-mono text-content-muted uppercase tracking-wider">
            {title}
          </span>
          <div className="text-2xl lg:text-3xl font-heading font-extrabold text-content-primary mt-1.5 mb-1">
            {value}
          </div>
          {subtitle && <p className="text-xs text-content-muted">{subtitle}</p>}
        </div>

        {icon && (
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center font-mono font-medium ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {change}
          </span>
          <span className="text-content-muted font-mono">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default AdminStatCard;
