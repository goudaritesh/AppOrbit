import apiClient from './axios';

/**
 * Authentication API Service
 * Encapsulates all backend authentication and account lifecycle HTTP requests.
 */
export const authApi = {
  /**
   * Register a new User or Developer account
   * @param {object} data - { name, email, password, role }
   */
  signup: async (data) => {
    return await apiClient.post('/auth/signup', data);
  },

  /**
   * Authenticate with email & password
   * @param {object} credentials - { email, password }
   */
  login: async (credentials) => {
    return await apiClient.post('/auth/login', credentials);
  },

  /**
   * Authenticate or register with Google OAuth
   * @param {object} payload - { credential, role }
   */
  googleLogin: async (payload) => {
    return await apiClient.post('/auth/google', payload);
  },

  /**
   * Authenticate with Firebase Email/Password token
   * @param {object} payload - { idToken }
   */
  firebaseLogin: async (payload) => {
    return await apiClient.post('/auth/firebase-login', payload);
  },

  /**
   * Complete profile after Firebase registration
   * @param {object} payload - { idToken, name, role }
   */
  firebaseSignup: async (payload) => {
    return await apiClient.post('/auth/firebase-signup', payload);
  },

  /**
   * Logout user, clear server-side refresh token and cookie
   */
  logout: async () => {
    return await apiClient.post('/auth/logout');
  },

  /**
   * Exchange HttpOnly refresh cookie for a new short-lived access token
   */
  refreshToken: async () => {
    return await apiClient.post('/auth/refresh-token');
  },

  /**
   * Request password reset instructions
   * @param {string} email
   */
  forgotPassword: async (email) => {
    return await apiClient.post('/auth/forgot-password', { email });
  },

  /**
   * Submit new password with reset token
   * @param {object} data - { token, newPassword, confirmPassword }
   */
  resetPassword: async (data) => {
    return await apiClient.post('/auth/reset-password', data);
  },

  /**
   * Verify email address with verification token
   * @param {string} token
   */
  verifyEmail: async (token) => {
    return await apiClient.post('/auth/verify-email', { token });
  },

  /**
   * Resend email verification link
   * @param {string} email
   */
  resendVerification: async (email) => {
    return await apiClient.post('/auth/resend-verification', { email });
  },

  /**
   * Retrieve current authenticated user profile
   */
  getMe: async () => {
    return await apiClient.get('/auth/me');
  },

  /**
   * Update authenticated user profile
   * @param {object} profileData - { name, bio, phoneNumber, githubUrl, portfolioUrl, profileImage }
   */
  updateProfile: async (profileData) => {
    return await apiClient.patch('/auth/profile', profileData);
  },

  /**
   * Upgrades the user to developer role using 1-time free trial
   */
  upgradeToTrial: async () => {
    return await apiClient.post('/auth/upgrade-trial');
  },
};

export default authApi;
