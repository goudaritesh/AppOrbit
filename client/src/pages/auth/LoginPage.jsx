import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, RotateCcw } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/authApi';
import { setCredentials } from '../../store/slices/authSlice';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [isResending, setIsResending] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(false);
    setUnverifiedEmail(null);

    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const { accessToken, user } = response.data;

      // Update Redux authentication state
      dispatch(setCredentials({ accessToken, user }));
      toast.success(`Welcome back, ${user.name}!`);

      // Determine redirection path based on authenticated role
      const intendedDestination = location.state?.from;

      if (intendedDestination) {
        navigate(intendedDestination, { replace: true });
      } else if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        navigate('/admin', { replace: true });
      } else if (user.role === 'DEVELOPER') {
        navigate('/developer', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      if (err.emailVerified === false) {
        setUnverifiedEmail(err.email || email);
        toast.error('Please verify your email address to continue.');
      } else {
        toast.error(err.message || 'Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setIsResending(true);
    try {
      const res = await authApi.resendVerification(unverifiedEmail);
      toast.success(res.message || 'Verification link sent to your email.');
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center p-2 shadow-sm group-hover:border-primary/50 transition-colors">
              <img src="/logo.svg" alt="AppOrbit" className="w-full h-full object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold font-heading text-content-primary tracking-tight">
            Sign in to AppOrbit
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Access your developer workspace, manage applications, or explore tools.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-surface border border-white/10 p-6 sm:p-8 shadow-card">
          {unverifiedEmail && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6 flex flex-col gap-2.5">
              <div className="flex items-start gap-2 text-xs text-amber-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Your email (<strong className="font-mono">{unverifiedEmail}</strong>) has not been verified yet.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                isLoading={isResending}
                onClick={handleResendVerification}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                className="w-full justify-center text-xs"
              >
                Resend Verification Email
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="developer@apporbit.io"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
              />
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:text-primary-hover transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full justify-center mt-2"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Registration Notice */}
          <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-content-muted">
            Don't have an account yet?{' '}
            <Link to="/signup" className="text-primary hover:underline font-semibold">
              Create an account
            </Link>
          </div>
        </div>

        {/* Security Guarantee */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-content-dim font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Protected by AppOrbit Security Perimeter</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
