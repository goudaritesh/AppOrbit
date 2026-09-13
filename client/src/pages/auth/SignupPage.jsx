import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
import { GoogleLogin } from '@react-oauth/google';
import { authApi } from '../../api/authApi';
import { setCredentials } from '../../store/slices/authSlice';
import { auth, createUserWithEmailAndPassword, sendEmailVerification } from '../../config/firebase';

export const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdEmail, setCreatedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

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

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      toast.error('Registration is restricted to valid @gmail.com accounts only.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.signup({ name, email, password, role });

      setCreatedEmail(email);
      setIsSuccess(true);
      toast.success('Account created! Please verify your email.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed.');
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

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!agreeTerms) {
      toast.error('Please agree to the Platform Terms and Distribution Guidelines.');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authApi.googleLogin({
        credential: credentialResponse.credential,
        role,
      });
      const { accessToken, user } = response.data;

      dispatch(setCredentials({ accessToken, user }));
      toast.success(`Welcome to AppOrbit, ${user.name.split(' ')[0]}!`);

      const from = location.state?.from?.pathname || (user.role === 'DEVELOPER' ? '/developer/dashboard' : '/admin/dashboard');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Google authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Banner */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center p-2 shadow-sm group-hover:border-primary/50 transition-colors">
              <img src="/logo.png" alt="AppOrbit" className="w-full h-full object-cover" />
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
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<UserIcon className="w-4 h-4" />}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-content-primary">Account Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-content-primary cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="USER"
                        checked={role === 'USER'}
                        onChange={(e) => setRole(e.target.value)}
                        className="accent-primary"
                      />
                      Standard User
                    </label>
                    <label className="flex items-center gap-2 text-xs text-content-primary cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="DEVELOPER"
                        checked={role === 'DEVELOPER'}
                        onChange={(e) => setRole(e.target.value)}
                        className="accent-primary"
                      />
                      Developer
                    </label>
                  </div>
                </div>

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
                  Register Account
                </Button>
              </form>

              <div className="mt-6 mb-6 relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center border-t border-white/10"></div>
                <span className="relative z-10 px-3 bg-surface text-xs font-mono text-content-dim">OR</span>
              </div>

              <div className="flex justify-center w-full mb-4">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google signup was unsuccessful. Please try again.')}
                  useOneTap
                  theme="filled_black"
                  shape="pill"
                  text="signup_with"
                  width="100%"
                />
              </div>

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
