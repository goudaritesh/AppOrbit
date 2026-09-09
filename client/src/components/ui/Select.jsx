import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Reusable Select Component
 */
export const Select = React.forwardRef(
  (
    {
      label,
      options = [],
      placeholder = 'Select an option',
      error,
      helperText,
      required = false,
      disabled = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-content-secondary flex items-center gap-1"
          >
            {label}
            {required && <span className="text-accent-rose">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            className={`w-full appearance-none bg-[#070A12] text-content-primary text-sm rounded-lg border px-3.5 py-2.5 pr-10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              error
                ? 'border-accent-rose focus:border-accent-rose'
                : 'border-white/10 hover:border-white/20 focus:border-primary'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-low' : ''} ${className}`}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => {
              const value = typeof opt === 'object' ? opt.value : opt;
              const label = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={value} value={value} className="bg-surface-elevated text-content-primary">
                  {label}
                </option>
              );
            })}
          </select>
          <ChevronDown className="absolute right-3 w-4 h-4 text-content-dim pointer-events-none" />
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

Select.displayName = 'Select';
export default Select;
