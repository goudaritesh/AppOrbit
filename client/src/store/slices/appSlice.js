import { createSlice } from '@reduxjs/toolkit';

/**
 * App Slice
 * Manages global search queries, category filters, and active app selections.
 */
const initialState = {
  searchQuery: '',
  selectedCategory: 'All',
  sortBy: 'featured',
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    resetFilters: (state) => {
      state.searchQuery = '';
      state.selectedCategory = 'All';
      state.sortBy = 'featured';
    },
  },
});

export const { setSearchQuery, setSelectedCategory, setSortBy, resetFilters } = appSlice.actions;

export default appSlice.reducer;
