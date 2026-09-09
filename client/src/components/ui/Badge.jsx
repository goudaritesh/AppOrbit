import React from 'react';

/**
 * Reusable Badge Component
 *
 * @param {object} props
 * @param {'success'|'warning'|'error'|'info'|'neutral'|'published'|'pending'|'rejected'|'draft'} [props.variant='neutral']
 * @param {boolean} [props.dot=true]
 * @param {'sm'|'md'} [props.size='sm']
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className='']
 */
export const Badge = ({
  variant = 'neutral',
  dot = true,
  size = 'sm',
  children,
  className = '',
}) => {
  const styles = {
    success: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    published: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    warning: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      dot: 'bg-amber-400',
    },
    pending: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      dot: 'bg-amber-400',
    },
    error: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      dot: 'bg-rose-400',
    },
    rejected: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      dot: 'bg-rose-400',
    },
    info: {
      bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      dot: 'bg-cyan-400',
    },
    neutral: {
      bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
      dot: 'bg-slate-400',
    },
    draft: {
      bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
      dot: 'bg-slate-400',
    },
  };

  const selected = styles[variant] || styles.neutral;
  const sizeClass = size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full border ${selected.bg} ${sizeClass} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${selected.dot} animate-pulse`} />}
      {children}
    </span>
  );
};

export default Badge;
