import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import searchApi from '../../api/searchApi';

export const executeSearch = createAsyncThunk(
  'search/executeSearch',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await searchApi.search(params);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Search failed');
    }
  }
);

export const fetchSuggestions = createAsyncThunk(
  'search/fetchSuggestions',
  async (query, { rejectWithValue }) => {
    try {
      if (!query || query.trim().length === 0) {
        return { apps: [], categories: [], developers: [], popular: [] };
      }
      const response = await searchApi.getSuggestions(query);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch suggestions');
    }
  }
);

export const fetchPopularSearches = createAsyncThunk(
  'search/fetchPopularSearches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await searchApi.getPopularSearches();
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch popular searches');
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    filters: {
      category: '',
      technology: '',
      platform: '',
      minRating: '',
      sort: 'RELEVANCE',
    },
    results: [],
    pagination: { page: 1, limit: 12, total: 0, pages: 1 },
    suggestions: { apps: [], categories: [], developers: [], popular: [] },
    popularSearches: [],
    loading: false,
    suggestionsLoading: false,
    error: null,
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.query = action.payload;
    },
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        category: '',
        technology: '',
        platform: '',
        minRating: '',
        sort: 'RELEVANCE',
      };
    },
    clearSuggestions: (state) => {
      state.suggestions = { apps: [], categories: [], developers: [], popular: [] };
    },
  },
  extraReducers: (builder) => {
    builder
      // Search Execution
      .addCase(executeSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(executeSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.results || [];
        state.pagination = action.payload.pagination;
      })
      .addCase(executeSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Suggestions
      .addCase(fetchSuggestions.pending, (state) => {
        state.suggestionsLoading = true;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestions = action.payload;
      })
      .addCase(fetchSuggestions.rejected, (state) => {
        state.suggestionsLoading = false;
      })

      // Popular Searches
      .addCase(fetchPopularSearches.fulfilled, (state, action) => {
        state.popularSearches = action.payload || [];
      });
  },
});

export const { setSearchQuery, setFilter, resetFilters, clearSuggestions } = searchSlice.actions;
export default searchSlice.reducer;
