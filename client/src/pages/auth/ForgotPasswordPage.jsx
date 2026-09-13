import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/authApi';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
      toast.success('Password reset instructions dispatched.');
    } catch (err) {
      // Show generic confirmation even on network errors if safe, or notify
      setSubmitted(true);
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
              <img src="/logo.png" alt="AppOrbit" className="w-full h-full object-cover" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold font-heading text-content-primary tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Enter your registered email to receive password recovery instructions.
          </p>
        </div>

        <div className="rounded-3xl bg-surface border border-white/10 p-6 sm:p-8 shadow-card">
          {submitted ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <CheckCircle2 className="w-6 h-6 text-accent-emerald" />
              </div>
              <h3 className="font-heading font-bold text-sm text-content-primary">
                Instructions Dispatched
              </h3>
              <p className="text-xs text-content-muted leading-relaxed">
                If an account exists for <strong className="text-content-primary font-mono">{email}</strong>, a secure password reset link has been generated.
              </p>
              <div className="w-full p-3 rounded-xl bg-surface-elevated/80 border border-white/5 text-[11px] text-content-dim font-mono">
                Development notice: Check your server console for the generated reset link.
              </div>
              <Link to="/login" className="w-full mt-2">
                <Button variant="secondary" size="sm" className="w-full justify-center">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
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

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full justify-center mt-2"
                icon={<Send className="w-4 h-4" />}
              >
                Send Reset Link
              </Button>

              <div className="mt-4 pt-4 border-t border-white/5 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-content-muted hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
