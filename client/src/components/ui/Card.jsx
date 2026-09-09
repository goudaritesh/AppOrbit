import React from 'react';

/**
 * Reusable Card Component adhering to DESIGN.md surface specifications
 *
 * @param {object} props
 * @param {boolean} [props.hover=false] - Enables subtle elevation and border glow on hover
 * @param {'none'|'sm'|'md'|'lg'} [props.padding='md']
 * @param {string} [props.className='']
 * @param {React.ReactNode} [props.children]
 */
export const Card = ({
  hover = false,
  padding = 'md',
  className = '',
  children,
  onClick,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover
    ? 'hover:border-primary/40 hover:bg-surface-elevated/70 hover:shadow-card hover:-translate-y-0.5 cursor-pointer'
    : '';

  return (
    <div
      className={`rounded-2xl bg-surface border border-white/10 shadow-glass transition-all duration-200 backdrop-blur-sm ${
        paddingStyles[padding] || paddingStyles.md
      } ${hoverStyles} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ className = '', children }) => (
  <div className={`flex items-center justify-between pb-4 border-b border-white/5 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children }) => (
  <h3 className={`text-base font-semibold text-content-primary tracking-tight font-heading ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ className = '', children }) => (
  <p className={`text-xs text-content-muted mt-1 leading-relaxed ${className}`}>{children}</p>
);

export const CardContent = ({ className = '', children }) => (
  <div className={`pt-4 ${className}`}>{children}</div>
);

export const CardFooter = ({ className = '', children }) => (
  <div className={`mt-6 pt-4 border-t border-white/5 flex items-center justify-between ${className}`}>
    {children}
  </div>
);

export default Card;
