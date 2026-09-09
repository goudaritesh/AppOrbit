import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';

/**
 * AppOrbit Global Redux Store
 */
export const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
