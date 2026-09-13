import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import {
  User as UserIcon,
  Terminal,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/authApi';
import { setCredentials } from '../../store/slices/authSlice';

export const CompleteProfilePage = () => {
  const [accountType, setAccountType] = useState('USER');
  const [name, setName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // If someone lands here without an idToken in state, boot them to login
  const idToken = location.state?.idToken;

  useEffect(() => {
    if (!idToken) {
      toast.error('Session missing. Please sign in again.');
      navigate('/login');
    }
  }, [idToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.error('Please agree to the Platform Terms and Distribution Guidelines.');
      return;
    }

    if (name.trim().length < 2) {
      toast.error('Please enter a valid name.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.firebaseSignup({
        idToken,
        name,
        role: accountType,
      });

      const { accessToken, user } = response.data;
      dispatch(setCredentials({ accessToken, user }));
      toast.success('Profile created successfully! Welcome to AppOrbit.');

      const from = (user.role === 'DEVELOPER' ? '/developer/dashboard' : '/');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Profile completion failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!idToken) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-accent-emerald mb-4 shadow-glow">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-content-primary tracking-tight">
            Almost there!
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Your email is verified. Complete your profile to activate your account.
          </p>
        </div>

        {/* Signup Card */}
        <div className="rounded-3xl bg-surface border border-white/10 p-6 sm:p-8 shadow-card">
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
              Complete Registration
            </Button>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-content-dim font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Protected by AppOrbit Security Perimeter</span>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
