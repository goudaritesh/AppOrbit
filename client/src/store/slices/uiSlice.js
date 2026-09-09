import { createSlice } from '@reduxjs/toolkit';

/**
 * UI Slice
 * Manages responsive sidebar toggle states, modals, and interface overlays.
 */
const initialState = {
  isSidebarOpen: false,
  isMobileNavOpen: false,
  theme: 'dark',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
    toggleMobileNav: (state) => {
      state.isMobileNavOpen = !state.isMobileNavOpen;
    },
    setMobileNavOpen: (state, action) => {
      state.isMobileNavOpen = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, toggleMobileNav, setMobileNavOpen } = uiSlice.actions;

export default uiSlice.reducer;
