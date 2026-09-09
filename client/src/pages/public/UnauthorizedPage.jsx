import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Button from '../../components/ui/Button';

export const UnauthorizedPage = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-surface-elevated border border-rose-500/20 flex items-center justify-center text-accent-rose shadow-glow">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>
        <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-accent-rose font-mono text-xs font-bold">
          403
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-content-primary tracking-tight font-heading mb-3">
        Access Restricted
      </h1>
      <p className="text-sm text-content-muted max-w-md mb-8 leading-relaxed">
        You do not have permission to access this page or portal. Administrative clearance or a specialized developer workspace role is required.
      </p>

      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="primary" icon={<Home className="w-4 h-4" />}>
            Return Home
          </Button>
        </Link>
        <Link to="/explore">
          <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
            Explore Applications
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
