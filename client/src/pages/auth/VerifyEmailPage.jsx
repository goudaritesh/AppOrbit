import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle, Mail, ArrowRight, RotateCcw } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Loader from '../../components/common/Loader';
import { authApi } from '../../api/authApi';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const [status, setStatus] = useState(tokenFromUrl ? 'verifying' : 'idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!tokenFromUrl) return;

    const verify = async () => {
      try {
        await authApi.verifyEmail(tokenFromUrl);
        setStatus('success');
        toast.success('Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setErrorMessage(
          err.message || 'Verification token is invalid or has expired. Please request a new verification link.'
        );
      }
    };

    verify();
  }, [tokenFromUrl]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error('Please provide an email address.');
      return;
    }

    setIsResending(true);
    try {
      const res = await authApi.resendVerification(resendEmail);
      toast.success(res.message || 'Verification instructions sent.');
      setResendEmail('');
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification link.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-surface border border-white/10 p-6 sm:p-8 shadow-card text-center">
          {/* 1. Verifying State */}
          {status === 'verifying' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Loader size="lg" />
              </div>
              <h2 className="text-xl font-bold font-heading text-content-primary">
                Verifying Email Address...
              </h2>
              <p className="text-xs text-content-muted max-w-xs">
                Checking your cryptographic verification token against the AppOrbit security gateway.
              </p>
            </div>
          )}

          {/* 2. Success State */}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-accent-emerald flex items-center justify-center shadow-glow">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold font-heading text-content-primary">
                Email Successfully Verified!
              </h2>
              <p className="text-xs text-content-muted leading-relaxed max-w-sm">
                Your email has been authenticated and your account status is now active. You may log in to access the AppOrbit platform.
              </p>
              <Link to="/login" className="w-full mt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Sign In
                </Button>
              </Link>
            </div>
          )}

          {/* 3. Error or Idle State */}
          {(status === 'error' || status === 'idle') && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-accent-rose flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold font-heading text-content-primary">
                {status === 'error' ? 'Verification Failed' : 'Verify Your Email'}
              </h2>
              <p className="text-xs text-content-muted leading-relaxed">
                {errorMessage ||
                  'Please enter your email below to receive a new account verification link.'}
              </p>

              {/* Resend Form */}
              <form onSubmit={handleResend} className="w-full flex flex-col gap-3 mt-4 text-left">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="developer@apporbit.io"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  isLoading={isResending}
                  className="w-full justify-center"
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Resend Verification Email
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t border-white/5 w-full">
                <Link
                  to="/login"
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
