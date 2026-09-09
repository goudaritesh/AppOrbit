import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import downloadsApi from '../../api/downloadsApi';

export const initiateSecureDownload = createAsyncThunk(
  'downloads/initiateSecureDownload',
  async ({ appId, data = {} }, { rejectWithValue }) => {
    try {
      const response = await downloadsApi.initiateDownload(appId, data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to prepare download');
    }
  }
);

export const fetchUserDownloads = createAsyncThunk(
  'downloads/fetchUserDownloads',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await downloadsApi.getUserDownloads(params);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch downloads');
    }
  }
);

const downloadSlice = createSlice({
  name: 'downloads',
  initialState: {
    activeSession: null,
    preparing: false,
    downloadHistory: [],
    historyPagination: { page: 1, limit: 15, total: 0, pages: 1 },
    historyLoading: false,
    error: null,
  },
  reducers: {
    clearActiveSession: (state) => {
      state.activeSession = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initiate Download
      .addCase(initiateSecureDownload.pending, (state) => {
        state.preparing = true;
        state.error = null;
      })
      .addCase(initiateSecureDownload.fulfilled, (state, action) => {
        state.preparing = false;
        state.activeSession = action.payload;
      })
      .addCase(initiateSecureDownload.rejected, (state, action) => {
        state.preparing = false;
        state.error = action.payload;
      })

      // Fetch History
      .addCase(fetchUserDownloads.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchUserDownloads.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.downloadHistory = action.payload.history || [];
        state.historyPagination = action.payload.pagination;
      })
      .addCase(fetchUserDownloads.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearActiveSession } = downloadSlice.actions;
export default downloadSlice.reducer;
