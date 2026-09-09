import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Reusable Alert Component
 *
 * @param {object} props
 * @param {'info'|'success'|'warning'|'danger'} [props.variant='info']
 * @param {string} [props.title]
 * @param {React.ReactNode} props.children
 * @param {Function} [props.onDismiss]
 * @param {string} [props.className='']
 */
export const Alert = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) => {
  const configs = {
    info: {
      bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-200',
      icon: <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />,
    },
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
    },
    danger: {
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />,
    },
  };

  const current = configs[variant] || configs.info;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border ${current.bg} ${className}`}
      role="alert"
    >
      <div className="mt-0.5">{current.icon}</div>
      <div className="flex-1 text-sm">
        {title && <h5 className="font-semibold text-content-primary mb-1">{title}</h5>}
        <div className="text-content-secondary leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded-md hover:bg-white/10 text-content-muted hover:text-white transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
