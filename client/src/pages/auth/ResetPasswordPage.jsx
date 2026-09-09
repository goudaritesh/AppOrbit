import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/authApi';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid password reset link. Token is missing.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        token,
        newPassword,
        confirmPassword,
      });

      setIsSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      toast.error(err.message || 'Failed to reset password. Link may be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center p-2 shadow-sm group-hover:border-primary/50 transition-colors">
              <img src="/logo.svg" alt="AppOrbit" className="w-full h-full object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold font-heading text-content-primary tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Choose a strong password with at least 8 characters.
          </p>
        </div>

        <div className="rounded-3xl bg-surface border border-white/10 p-6 sm:p-8 shadow-card">
          {isSuccess ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-accent-emerald flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-sm text-content-primary">
                Password Reset Successfully
              </h3>
              <p className="text-xs text-content-muted leading-relaxed">
                Your credentials have been updated and existing sessions invalidated. Redirecting to login...
              </p>
              <Link to="/login" className="w-full mt-2">
                <Button variant="primary" size="sm" className="w-full justify-center">
                  Sign In Now
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!token && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  No reset token detected. Please use the link provided in your email.
                </div>
              )}

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••••••"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                helperText="Must include uppercase, lowercase, and a number (min. 8 chars)"
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={!token}
                className="w-full justify-center mt-2"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Update Password
              </Button>

              <div className="mt-4 pt-4 border-t border-white/5 text-center">
                <Link
                  to="/login"
                  className="text-xs text-content-muted hover:text-white transition-colors"
                >
                  Cancel and return to login
                </Link>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-content-dim font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Active sessions across all devices will be terminated</span>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
