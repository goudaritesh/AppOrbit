import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import analyticsApi from '../../api/analyticsApi';

export const fetchDeveloperOverview = createAsyncThunk(
  'analytics/fetchDeveloperOverview',
  async (range = '30d', { rejectWithValue }) => {
    try {
      const response = await analyticsApi.getDeveloperOverview({ range });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch developer analytics');
    }
  }
);

export const fetchAppAnalytics = createAsyncThunk(
  'analytics/fetchAppAnalytics',
  async ({ appId, range = '30d' }, { rejectWithValue }) => {
    try {
      const response = await analyticsApi.getAppAnalytics(appId, { range });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch app analytics');
    }
  }
);

export const fetchAdminPlatformAnalytics = createAsyncThunk(
  'analytics/fetchAdminPlatformAnalytics',
  async (range = '30d', { rejectWithValue }) => {
    try {
      const response = await analyticsApi.getAdminPlatformAnalytics({ range });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch platform analytics');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    developerOverview: null,
    appAnalytics: null,
    adminAnalytics: null,
    selectedRange: '30d',
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedRange: (state, action) => {
      state.selectedRange = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Developer Overview
      .addCase(fetchDeveloperOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeveloperOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.developerOverview = action.payload;
      })
      .addCase(fetchDeveloperOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // App Analytics
      .addCase(fetchAppAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.appAnalytics = action.payload;
      })
      .addCase(fetchAppAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Admin Analytics
      .addCase(fetchAdminPlatformAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminPlatformAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.adminAnalytics = action.payload;
      })
      .addCase(fetchAdminPlatformAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedRange } = analyticsSlice.actions;
export default analyticsSlice.reducer;
