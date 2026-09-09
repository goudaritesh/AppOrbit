import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import {
  Menu,
  X,
  ArrowRight,
  Sparkles,
  Terminal,
  User,
  LogOut,
  Shield,
  LayoutDashboard,
  Download,
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import NotificationBell from '../navigation/NotificationBell';
import { authApi } from '../../api/authApi';
import { logout } from '../../store/slices/authSlice';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore', path: '/explore' },
    { label: 'Search', path: '/search' },
    { label: 'Categories', path: '/categories' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Proceed with local logout regardless of network status
    } finally {
      dispatch(logout());
      toast.success('Logged out successfully.');
      navigate('/login');
    }
  };

  const isDeveloper = user?.role === 'DEVELOPER';
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 transition-colors">
      <div className="max-w-content-max mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-surface-low border border-white/10 flex items-center justify-center p-1.5 shadow-sm group-hover:border-primary/50 transition-colors">
            <img src="/logo.svg" alt="AppOrbit" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-lg text-content-primary tracking-tight leading-none">
              App<span className="text-primary">Orbit</span>
            </span>
            <span className="text-[9px] font-mono tracking-wider uppercase text-content-dim">
              Android Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive(link.path)
                  ? 'bg-white/10 text-white shadow-sm font-semibold'
                  : 'text-content-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Contextual Portal Links based on authenticated role */}
          {isAuthenticated && (isDeveloper || isAdmin) && (
            <>
              <div className="h-4 w-[1px] bg-white/10 mx-2" />

              {isDeveloper && (
                <Link
                  to="/developer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent-cyan hover:bg-accent-cyan/10 border border-accent-cyan/20 transition-all"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Developer Console</span>
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-secondary hover:bg-secondary/10 border border-secondary/20 transition-all"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Center</span>
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Desktop Action Buttons / Auth State */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/my-downloads"
                className="p-2 rounded-lg text-content-dim hover:text-indigo-400 hover:bg-white/5 transition-colors"
                title="My Downloads"
                aria-label="My Downloads"
              >
                <Download className="w-4 h-4" />
              </Link>

              <NotificationBell />

              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-elevated/70 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-medium text-content-primary max-w-[120px] truncate">
                  {user?.name}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/10 text-content-dim">
                  {user?.role}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-content-dim hover:text-accent-rose hover:bg-rose-500/10 transition-colors"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-content-muted hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-surface px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-primary/20 text-primary font-semibold'
                    : 'text-content-secondary hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-content-primary hover:bg-white/5"
                >
                  <User className="w-4 h-4 text-primary" /> Profile Settings
                </Link>

                {isDeveloper && (
                  <Link
                    to="/developer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-accent-cyan bg-accent-cyan/5 border border-accent-cyan/20"
                  >
                    <span className="flex items-center gap-2">
                      <Terminal className="w-4 h-4" /> Developer Console
                    </span>
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-secondary bg-secondary/5 border border-secondary/20"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Admin Center
                    </span>
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            {isAuthenticated ? (
              <Button
                variant="danger"
                size="md"
                className="w-full justify-center"
                icon={<LogOut className="w-4 h-4" />}
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                Log Out ({user?.name})
              </Button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="md" className="w-full justify-center">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full justify-center">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
