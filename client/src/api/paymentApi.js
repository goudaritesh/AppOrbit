import apiClient from './axios.js';

/**
 * Payment API client for Razorpay orders, signatures, manual QR submissions, and receipts
 */
export const paymentApi = {
  /**
   * Initialize a verified payment order on the server
   * Note: Client never sends an arbitrary price/amount; server resolves strictly from Plan ID
   */
  createOrder: (planId, billingCycle = 'MONTHLY') =>
    apiClient.post('/payments/create-order', { planId, billingCycle }),

  /**
   * Cryptographic verification of payment signature
   */
  verifyPayment: ({
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    paymentReference,
  }) =>
    apiClient.post('/payments/verify', {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      paymentReference,
    }),

  /**
   * Submit manual QR / UPI payment claim with optional proof screenshot
   */
  submitManualPayment: (formData) =>
    apiClient.post('/payments/manual/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Get developer's payment transaction ledger
   */
  getPaymentHistory: (params = {}) =>
    apiClient.get('/developer/payments', { params }),

  /**
   * Get single payment detail
   */
  getPaymentById: (paymentId) =>
    apiClient.get(`/developer/payments/${paymentId}`),

  /**
   * Download or view official payment receipt
   */
  getPaymentReceipt: (paymentId) =>
    apiClient.get(`/payments/${paymentId}/receipt`),
};

export default paymentApi;
