import React from 'react';

/**
 * Reusable Input Component
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.error]
 * @param {string} [props.helperText]
 * @param {boolean} [props.required=false]
 * @param {boolean} [props.disabled=false]
 * @param {React.ReactNode} [props.icon]
 * @param {string} [props.className='']
 */
export const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      required = false,
      disabled = false,
      icon = null,
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
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-content-dim pointer-events-none flex items-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={`w-full bg-[#070A12] text-content-primary placeholder:text-content-dim text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              icon ? 'pl-10 pr-3.5' : 'px-3.5'
            } py-2.5 ${
              error
                ? 'border-accent-rose focus:border-accent-rose focus:ring-accent-rose/20'
                : 'border-white/10 hover:border-white/20 focus:border-primary'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-low' : ''} ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <span className="text-xs text-accent-rose font-medium mt-0.5">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-content-dim mt-0.5">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
