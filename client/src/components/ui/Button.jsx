import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Button Component
 *
 * @param {object} props
 * @param {'primary'|'secondary'|'outline'|'danger'|'ghost'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.isLoading=false]
 * @param {boolean} [props.disabled=false]
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className='']
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon = null,
  children,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-primary to-secondary text-white shadow-glow hover:shadow-glow-lg hover:brightness-110 border border-white/10',
    secondary:
      'bg-surface-elevated text-content-primary hover:bg-surface-highlight border border-white/10 shadow-sm',
    outline:
      'bg-transparent text-content-primary hover:bg-white/5 border border-white/20 hover:border-white/40',
    danger:
      'bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20 border border-accent-rose/30',
    ghost:
      'bg-transparent text-content-muted hover:text-white hover:bg-white/5 border border-transparent',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.primary
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
