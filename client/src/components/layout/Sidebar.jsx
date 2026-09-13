import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Boxes,
  BarChart3,
  GitBranch,
  Crown,
  CreditCard,
  Bell,
  Settings,
  ShieldAlert,
  Users,
  CheckSquare,
  ArrowLeft,
  Sparkles,
  PlusCircle,
  User,
  Headphones,
  Flag,
  History,
  MessageSquare,
  Activity,
  Rocket,
  TrendingUp,
  Gift,
} from 'lucide-react';

/**
 * Reusable Console Sidebar for Developer and Admin layouts
 */
export const Sidebar = ({ portalType = 'developer', isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const usage = useSelector((state) => state.subscription?.usage);

  const developerLinks = [
    { label: 'Dashboard', path: '/developer', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'My Applications', path: '/developer/apps', icon: <Boxes className="w-4 h-4" /> },
    { label: 'User Messages', path: '/developer/messages', icon: <MessageSquare className="w-4 h-4 text-accent-cyan" /> },
    { label: 'Community Reviews', path: '/developer/reviews', icon: <MessageSquare className="w-4 h-4 text-purple-400" /> },
    { label: 'Create Application', path: '/developer/apps/create', icon: <PlusCircle className="w-4 h-4 text-accent-cyan" /> },
    { label: 'Upgrade Plans', path: '/developer/pricing', icon: <Crown className="w-4 h-4 text-amber-400" /> },
    { label: 'Subscription', path: '/developer/subscription', icon: <Sparkles className="w-4 h-4 text-accent-cyan" /> },
    { label: 'Billing & Payments', path: '/developer/payments', icon: <CreditCard className="w-4 h-4 text-emerald-400" /> },
    { label: 'Analytics', path: '/developer/analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Developer Profile', path: '/developer/profile', icon: <User className="w-4 h-4" /> },
    { label: 'Notification Alerts', path: '/developer/settings/notifications', icon: <Bell className="w-4 h-4 text-indigo-400" /> },
    { label: 'Invite & Earn', path: '/developer/referrals', icon: <Gift className="w-4 h-4 text-fuchsia-400" /> },
    { label: 'Settings', path: '/developer/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const adminLinks = [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Beta Operations', path: '/admin/beta', icon: <Rocket className="w-4 h-4 text-fuchsia-400" /> },
    { label: 'Growth Center', path: '/admin/growth', icon: <TrendingUp className="w-4 h-4 text-emerald-400" /> },
    { label: 'Applications', path: '/admin/apps', icon: <Boxes className="w-4 h-4" /> },
    { label: 'Security Reviews', path: '/admin/security', icon: <ShieldAlert className="w-4 h-4 text-amber-400" /> },
    { label: 'Developers', path: '/admin/developers', icon: <Users className="w-4 h-4" /> },
    { label: 'Users', path: '/admin/users', icon: <User className="w-4 h-4" /> },
    { label: 'Subscriptions', path: '/admin/subscriptions', icon: <Crown className="w-4 h-4 text-accent-cyan" /> },
    { label: 'Payments', path: '/admin/payments', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Support Desk', path: '/admin/support', icon: <Headphones className="w-4 h-4" /> },
    { label: 'Review Moderation', path: '/admin/reviews', icon: <MessageSquare className="w-4 h-4 text-purple-400" /> },
    { label: 'Reports', path: '/admin/reports', icon: <Flag className="w-4 h-4 text-rose-400" /> },
    { label: 'Platform Analytics', path: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'System Health', path: '/admin/system-health', icon: <Activity className="w-4 h-4 text-emerald-400" /> },
    { label: 'Notifications', path: '/admin/notifications', icon: <Bell className="w-4 h-4" /> },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: <History className="w-4 h-4" /> },
    { label: 'System Settings', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const links = portalType === 'admin' ? adminLinks : developerLinks;

  const isActive = (path) => {
    if (path.includes('#')) return false;
    if (path === '/developer' || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-surface-low border-r border-white/10 z-50 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Logo & Portal Branding */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 bg-surface/50">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="AppOrbit" className="w-8 h-8 rounded-lg object-cover shrink-0" />
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-sm text-content-primary leading-tight">
                  AppOrbit
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                  {portalType === 'admin' ? 'Admin Ops' : 'Dev Console'}
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Allotment Card (Developer Portal only) */}
          {portalType === 'developer' && (
            <Link
              to="/developer/subscription"
              className="p-3 m-3 rounded-xl bg-surface border border-white/5 flex flex-col gap-2 hover:border-white/10 transition-all group"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-content-muted">Apps Quota</span>
                <span className="text-accent-cyan font-mono">
                  {usage?.applicationsUsed ?? 0} / {usage?.appsLimit ?? 1}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        ((usage?.applicationsUsed ?? 0) / (usage?.appsLimit || 1)) * 100
                      )
                    )}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-content-dim font-mono">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Sparkles className="w-3 h-3" />
                  <span>{usage?.planName || 'Free Tier'}</span>
                </span>
                <span className="group-hover:text-primary transition-colors">Manage →</span>
              </div>
            </Link>
          )}

          {/* Nav Links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-primary text-white font-semibold shadow-glow'
                      : 'text-content-secondary hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {link.icon}
                    <span>{link.label}</span>
                  </div>
                  {link.count !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono font-bold">
                      {link.count}
                    </span>
                  )}
                  {link.badge && (
                    <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-content-dim">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Identity / Return Link */}
        <div className="p-3 border-t border-white/10 bg-surface/40 flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-content-dim hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Site</span>
          </Link>
          <Link
            to={portalType === 'developer' ? '/developer/profile' : '/admin'}
            className="p-2.5 rounded-xl bg-surface border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : portalType === 'admin'
                  ? 'AD'
                  : 'DV'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-content-primary truncate">
                  {user?.name || (portalType === 'admin' ? 'Root Admin' : 'Developer')}
                </span>
                <span className="text-[10px] text-content-dim truncate">
                  {user?.developerProfile?.companyName || user?.email || (portalType === 'admin' ? 'Security Operations' : 'Verified Developer')}
                </span>
              </div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
