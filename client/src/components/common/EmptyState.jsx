import React from 'react';
import { PackageOpen } from 'lucide-react';

/**
 * Reusable EmptyState Component
 *
 * @param {object} props
 * @param {React.ReactNode} [props.icon]
 * @param {string} props.title
 * @param {string} props.description
 * @param {React.ReactNode} [props.action]
 * @param {string} [props.className='']
 */
export const EmptyState = ({
  icon = <PackageOpen className="w-8 h-8 text-content-dim" />,
  title = 'No items found',
  description = 'There are currently no items matching your criteria.',
  action = null,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl bg-surface border border-white/10 p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-white/5 flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h4 className="text-base font-bold text-content-primary font-heading mb-1.5">{title}</h4>
      <p className="text-xs text-content-muted leading-relaxed max-w-sm mb-6">{description}</p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
};

export default EmptyState;
