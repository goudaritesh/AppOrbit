import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import appReducer from './slices/appSlice';
import uiReducer from './slices/uiSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import paymentReducer from './slices/paymentSlice';
import notificationReducer from './slices/notificationSlice';

// Phase 9 Reducers
import reviewReducer from './slices/reviewSlice';
import downloadReducer from './slices/downloadSlice';
import searchReducer from './slices/searchSlice';
import analyticsReducer from './slices/analyticsSlice';

/**
 * Root Reducer combining all state domains
 */
export const rootReducer = combineReducers({
  auth: authReducer,
  app: appReducer,
  ui: uiReducer,
  subscription: subscriptionReducer,
  payment: paymentReducer,
  notification: notificationReducer,
  reviews: reviewReducer,
  downloads: downloadReducer,
  search: searchReducer,
  analytics: analyticsReducer,
});

export default rootReducer;

