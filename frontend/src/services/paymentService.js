import api from './api';

export const paymentService = {
  // Get all payments
  getPayments: async () => {
    try {
      return await api.get('/payments');
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  // Get payment by ID
  getPaymentById: async (id) => {
    try {
      return await api.get(`/payments/${id}`);
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  },

  // Create new payment
  createPayment: async (paymentData) => {
    try {
      return await api.post('/payments', paymentData);
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Update payment
  updatePayment: async (id, paymentData) => {
    try {
      return await api.put(`/payments/${id}`, paymentData);
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  // Delete payment
  deletePayment: async (id) => {
    try {
      return await api.delete(`/payments/${id}`);
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  },

  // Get payments by order ID
  getPaymentsByOrderId: async (orderId) => {
    try {
      return await api.get(`/payments/order/${orderId}`);
    } catch (error) {
      console.error('Error fetching payments by order:', error);
      throw error;
    }
  },

  // Get payment stats
  getPaymentStats: async () => {
    try {
      return await api.get('/payments/stats');
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw error;
    }
  }
}; 