import axios from 'axios';
import { store } from '../store/store';
import { setCredentials, logout } from '../store/slices/authSlice';

/**
 * Base URL resolved from environment variable VITE_API_BASE_URL.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // Send HttpOnly refresh cookies across origins
});

// Refresh token queue management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/* ==========================================================================
   Request Interceptor: Injects Bearer token from Redux in-memory store
   ========================================================================== */
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth?.accessToken;

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ==========================================================================
   Response Interceptor: Auto-refreshes token on 401 Unauthorized
   ========================================================================== */
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Normalize error details for application consumption
    const normalizedError = {
      message:
        error.response?.data?.message ||
        (error.request
          ? 'No response from server. Please check your network connection.'
          : error.message),
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors || [],
      emailVerified: error.response?.data?.emailVerified,
      data: error.response?.data,
    };

    // If request failed with 401 and was not already a retry or refresh/login request
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh-token') &&
      !originalRequest.url?.includes('/auth/signup')
    ) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint with HttpOnly cookie
        const res = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data?.data?.accessToken;
        const user = res.data?.data?.user;

        if (newAccessToken) {
          store.dispatch(setCredentials({ accessToken: newAccessToken, user }));
          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('No access token returned from refresh');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        store.dispatch(logout());
        return Promise.reject(normalizedError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
