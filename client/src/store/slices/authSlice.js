import { createSlice } from '@reduxjs/toolkit';

/**
 * Authentication Slice (Phase 2 Production Implementation)
 * Manages in-memory access token, user identity, and session initialization.
 */
const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  authInitialized: false,
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      if (user) state.user = user;
      if (accessToken) state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.error = null;
      state.authInitialized = true;
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
    },
    updateUser: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };
    },
    setAuthInitialized: (state, action) => {
      state.authInitialized = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.authInitialized = true;
    },
  },
});

export const {
  setLoading,
  setCredentials,
  setAccessToken,
  updateUser,
  setAuthInitialized,
  setError,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
