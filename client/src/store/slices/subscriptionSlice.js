import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  plans: [],
  currentSubscription: null,
  usage: {
    planSlug: 'free',
    planName: 'Free Tier',
    appsLimit: 1,
    applicationsUsed: 0,
    remainingApps: 1,
    canCreateApp: true,
  },
  loading: false,
  error: null,
};

export const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setPlans: (state, action) => {
      state.plans = action.payload;
    },
    setCurrentSubscription: (state, action) => {
      state.currentSubscription = action.payload;
    },
    setUsage: (state, action) => {
      state.usage = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setPlans,
  setCurrentSubscription,
  setUsage,
  setLoading,
  setError,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
