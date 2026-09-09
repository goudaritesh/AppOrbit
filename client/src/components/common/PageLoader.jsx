import React from 'react';
import Loader from './Loader';

/**
 * Full page / section centered loader with brand branding
 */
export const PageLoader = ({ message = 'Loading AppOrbit...' }) => {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-4 px-4">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-white/10 flex items-center justify-center shadow-glass">
          <Loader size="lg" />
        </div>
      </div>
      <p className="text-sm font-medium text-content-muted animate-pulse font-mono tracking-wide">
        {message}
      </p>
    </div>
  );
};

export default PageLoader;
