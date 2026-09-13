import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, RotateCcw } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { authApi } from '../../api/authApi';
import { setCredentials } from '../../store/slices/authSlice';
import { auth, signInWithEmailAndPassword, sendEmailVerification } from '../../config/firebase';

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser.emailVerified) {
        setUnverifiedEmail(firebaseUser.email);
        toast.error('Please verify your email address to continue.');
        setIsLoading(false);
        return;
      }

      const idToken = await firebaseUser.getIdToken();
      const response = await authApi.firebaseLogin({ idToken });
      
      const { accessToken, user } = response.data;
      dispatch(setCredentials({ accessToken, user }));
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);

      const from = location.state?.from?.pathname || (user.role === 'DEVELOPER' ? '/developer/dashboard' : (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? '/admin/dashboard' : '/');
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code === 'PROFILE_NOT_FOUND' || err.response?.data?.code === 'PROFILE_NOT_FOUND') {
        const idToken = await auth.currentUser?.getIdToken();
        toast.success('Firebase login successful. Please complete your profile.');
        navigate('/complete-profile', { state: { idToken } });
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        toast.error('Invalid email or password.');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Login failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setUnverifiedEmail(null);
    try {
      const response = await authApi.googleLogin({
        credential: credentialResponse.credential,
        role: 'USER', // Defaults to USER, they can switch to DEVELOPER in profile if needed
      });
      const { accessToken, user } = response.data;

      dispatch(setCredentials({ accessToken, user }));
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);

      const from = location.state?.from?.pathname || (user.role === 'DEVELOPER' ? '/developer/dashboard' : (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? '/admin/dashboard' : '/');
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code === 'EMAIL_UNVERIFIED') {
        setUnverifiedEmail(err.email || email);
        toast.error('Please verify your Google email address to continue.');
      } else {
        toast.error(err.message || 'Google authentication failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        toast.success('Verification link sent to your email.');
      } else {
        toast.error('Session expired. Please try logging in again.');
      }
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
            <img src="/logo.png" alt="AppOrbit" className="w-12 h-12 rounded-xl object-cover shrink-0 group-hover:opacity-80 transition-opacity" />
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

          <div className="mt-6 mb-6 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center border-t border-white/10"></div>
            <span className="relative z-10 px-3 bg-surface text-xs font-mono text-content-dim">OR</span>
          </div>

          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google login was unsuccessful. Please try again.')}
              useOneTap
              theme="filled_black"
              shape="pill"
              text="continue_with"
              width="100%"
            />
          </div>

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
