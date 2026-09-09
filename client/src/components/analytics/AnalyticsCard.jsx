import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const AnalyticsCard = ({
  title,
  value,
  icon: Icon,
  change = null,
  isPositive = true,
  subtitle = '',
}) => {
  return (
    <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3 hover:border-slate-700/80 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-3">
        <span className="text-3xl font-black text-white tracking-tight">{value}</span>
        {change && (
          <span
            className={`inline-flex items-center text-xs font-bold ${
              isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
            )}
            {change}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};

export default AnalyticsCard;
