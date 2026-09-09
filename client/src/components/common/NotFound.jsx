import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Reusable 404 View Component
 */
export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-surface-elevated border border-white/10 flex items-center justify-center text-primary shadow-glow">
          <Compass className="w-12 h-12 animate-pulse" />
        </div>
        <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-primary font-mono text-xs font-bold">
          404
        </span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-content-primary tracking-tight font-heading mb-3">
        Lost in Orbit
      </h1>
      <p className="text-sm text-content-muted max-w-md mb-8 leading-relaxed">
        The destination or application release you are looking for has been moved, archived, or does not exist in this sector.
      </p>
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Mission Control
          </Button>
        </Link>
        <Link to="/explore">
          <Button variant="secondary">Explore Apps</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
