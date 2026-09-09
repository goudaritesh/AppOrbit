import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Menu, Search, ShieldCheck } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationBell from '../navigation/NotificationBell';

/**
 * Dashboard Layout Wrapper
 * Shell for Developer Console and Admin Command views.
 */
export const DashboardLayout = ({ portalType = 'developer' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic portal check based on route prefix if not passed explicitly
  const effectivePortal =
    portalType || (location.pathname.startsWith('/admin') ? 'admin' : 'developer');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sidebar */}
      <Sidebar
        portalType={effectivePortal}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Container offset by sidebar on large viewports */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 glass-panel border-b border-white/10 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-content-muted hover:text-white hover:bg-white/10"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Section context */}
            <div className="flex items-center gap-2 text-xs font-mono text-content-muted">
              <span>{effectivePortal === 'admin' ? 'Admin Center' : 'Developer Console'}</span>
              <span>/</span>
              <span className="text-content-primary font-semibold capitalize">
                {location.pathname.split('/').pop() || 'Overview'}
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Phase 8 Real-time notification bell */}
            <NotificationBell />

            {/* Quick user avatar */}
            <div className="w-8 h-8 rounded-full bg-surface-elevated border border-white/10 flex items-center justify-center text-xs font-bold text-content-primary">
              {effectivePortal === 'admin' ? 'A' : 'R'}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-content-max w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
