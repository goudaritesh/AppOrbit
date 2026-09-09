import React from 'react';

/**
 * Reusable Textarea Component
 */
export const Textarea = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      required = false,
      disabled = false,
      rows = 4,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-content-secondary flex items-center gap-1"
          >
            {label}
            {required && <span className="text-accent-rose">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          disabled={disabled}
          required={required}
          className={`w-full bg-[#070A12] text-content-primary placeholder:text-content-dim text-sm rounded-lg border px-3.5 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            error
              ? 'border-accent-rose focus:border-accent-rose focus:ring-accent-rose/20'
              : 'border-white/10 hover:border-white/20 focus:border-primary'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-low' : ''} ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-xs text-accent-rose font-medium mt-0.5">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-content-dim mt-0.5">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
