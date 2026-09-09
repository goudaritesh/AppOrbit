import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User as UserIcon,
  Mail,
  Lock,
  Terminal,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/authApi';

export const SignupPage = () => {
  const [accountType, setAccountType] = useState('USER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdEmail, setCreatedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.error('Please agree to the Platform Terms and Distribution Guidelines.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error('Password must contain uppercase, lowercase, and a number.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.signup({
        name,
        email,
        password,
        role: accountType,
      });

      setCreatedEmail(email);
      setIsSuccess(true);
      toast.success(response.message || 'Account created successfully!');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!createdEmail) return;
    setIsResending(true);
    try {
      const res = await authApi.resendVerification(createdEmail);
      toast.success(res.message || 'Verification email resent.');
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Banner */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center p-2 shadow-sm group-hover:border-primary/50 transition-colors">
              <img src="/logo.svg" alt="AppOrbit" className="w-full h-full object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold font-heading text-content-primary tracking-tight">
            Create your AppOrbit Account
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Join thousands of developers and users across the Android ecosystem.
          </p>
        </div>

        {/* Signup Card */}
        <div className="rounded-3xl bg-surface border border-white/10 p-6 sm:p-8 shadow-card">
          {isSuccess ? (
            /* Post-Signup Email Verification Notice */
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-accent-emerald flex items-center justify-center shadow-glow">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold font-heading text-content-primary">
                Verify Your Email
              </h2>
              <p className="text-xs text-content-muted leading-relaxed max-w-sm">
                We've dispatched a cryptographic verification link to{' '}
                <strong className="text-content-primary font-mono">{createdEmail}</strong>.
                Please verify your address to activate your account.
              </p>

              <div className="w-full p-3 rounded-xl bg-surface-elevated/80 border border-white/5 text-[11px] text-content-dim font-mono">
                Development notice: In console email mode, check your server terminal for the direct verification link!
              </div>

              <div className="flex flex-col gap-2 w-full mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isResending}
                  onClick={handleResendVerification}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                  className="w-full justify-center"
                >
                  Resend Verification Link
                </Button>
                <Link to="/login" className="w-full">
                  <Button variant="primary" size="sm" className="w-full justify-center">
                    Proceed to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Account Type Selection Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-elevated border border-white/5 mb-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAccountType('USER')}
                  className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    accountType === 'USER'
                      ? 'bg-primary text-white shadow-glow'
                      : 'text-content-muted hover:text-white'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>User</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('DEVELOPER')}
                  className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    accountType === 'DEVELOPER'
                      ? 'bg-primary text-white shadow-glow'
                      : 'text-content-muted hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Developer</span>
                </button>
              </div>

              <p className="text-[11px] text-content-dim mb-4 text-center">
                {accountType === 'DEVELOPER'
                  ? 'Publish APKs, manage release channels, and access developer metrics.'
                  : 'Discover verified applications, download APKs, and write reviews.'}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Full Name or Studio Name"
                  placeholder={accountType === 'DEVELOPER' ? 'AuraHealth Labs' : 'Ritesh Kumar'}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<UserIcon className="w-4 h-4" />}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Min. 8 chars (A-Z, a-z, 0-9)"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                />

                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded bg-[#070A12] border-white/20 text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="terms" className="text-xs text-content-muted leading-tight">
                    I agree to the AppOrbit Terms of Service, Privacy Policy, and Distribution Guidelines.
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  className="w-full justify-center mt-2"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Register as {accountType === 'DEVELOPER' ? 'Developer' : 'User'}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-content-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-content-dim font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Zero-Knowledge Credential Security Perimeter</span>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
