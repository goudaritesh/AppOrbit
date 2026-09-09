import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  payments: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  },
  activeOrder: null,
  verificationStatus: 'IDLE', // 'IDLE' | 'PROCESSING' | 'VERIFYING' | 'SUCCESS' | 'FAILED'
  selectedPayment: null,
  loading: false,
  error: null,
};

export const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setPayments: (state, action) => {
      state.payments = action.payload.payments || [];
      if (action.payload.pagination) {
        state.pagination = action.payload.pagination;
      }
    },
    setActiveOrder: (state, action) => {
      state.activeOrder = action.payload;
    },
    setVerificationStatus: (state, action) => {
      state.verificationStatus = action.payload;
    },
    setSelectedPayment: (state, action) => {
      state.selectedPayment = action.payload;
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
  setPayments,
  setActiveOrder,
  setVerificationStatus,
  setSelectedPayment,
  setLoading,
  setError,
} = paymentSlice.actions;

export default paymentSlice.reducer;
