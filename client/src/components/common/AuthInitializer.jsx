import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authApi } from '../../api/authApi';
import { setCredentials, setAuthInitialized } from '../../store/slices/authSlice';
import PageLoader from './PageLoader';

/**
 * AuthInitializer Component
 * Performs a silent token refresh upon initial application load to restore
 * authenticated sessions from the HttpOnly refresh token cookie.
 */
export const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const { authInitialized } = useSelector((state) => state.auth);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        const response = await authApi.refreshToken();
        if (isMounted && response?.data?.accessToken) {
          dispatch(
            setCredentials({
              accessToken: response.data.accessToken,
              user: response.data.user,
            })
          );
        }
      } catch (err) {
        // No active refresh token or expired - remain logged out
      } finally {
        if (isMounted) {
          dispatch(setAuthInitialized(true));
        }
      }
    };

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  if (!authInitialized) {
    return <PageLoader message="Initializing secure AppOrbit session..." />;
  }

  return children;
};

export default AuthInitializer;
