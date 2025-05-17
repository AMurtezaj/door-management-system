import api from './apiService';

/**
 * Get all orders
 * @returns {Promise} - Promise with orders data
 */
export const getAllOrders = async () => {
  try {
    const response = await api.get('/orders');
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    if (error.response && error.response.status === 401) {
      // Auth error is handled by apiService interceptor
      return [];
    }
    throw new Error(error.response?.data?.message || 'Gabim gjatë ngarkimit të porosive');
  }
};

/**
 * Get order by ID
 * @param {number} id - Order ID
 * @returns {Promise} - Promise with order data
 */
export const getOrderById = async (id) => {
  try {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    throw new Error(error.response?.data?.message || `Gabim gjatë ngarkimit të porosisë ${id}`);
  }
};

/**
 * Get orders by day
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise} - Promise with orders data
 */
export const getOrdersByDay = async (date) => {
  try {
    const response = await api.get(`/orders/day/${date}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching orders for ${date}:`, error);
    if (error.response && error.response.status === 401) {
      return [];
    }
    throw new Error(error.response?.data?.message || `Gabim gjatë ngarkimit të porosive për datën ${date}`);
  }
};

/**
 * Create new order
 * @param {Object} orderData - Order data
 * @returns {Promise} - Promise with created order data
 */
export const createOrder = async (orderData) => {
  try {
    const response = await api.post('/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error(error.response?.data?.message || 'Gabim gjatë krijimit të porosisë');
  }
};

/**
 * Update order
 * @param {number} id - Order ID
 * @param {Object} orderData - Updated order data
 * @returns {Promise} - Promise with updated order data
 */
export const updateOrder = async (id, orderData) => {
  try {
    const response = await api.put(`/orders/${id}`, orderData);
    return response.data;
  } catch (error) {
    console.error(`Error updating order ${id}:`, error);
    throw new Error(error.response?.data?.message || `Gabim gjatë përditësimit të porosisë ${id}`);
  }
};

/**
 * Update payment status
 * @param {number} id - Order ID
 * @param {boolean} isPaid - Payment status
 * @returns {Promise} - Promise with updated order data
 */
export const updatePaymentStatus = async (id, isPaid) => {
  try {
    const response = await api.patch(`/orders/${id}/payment-status`, { isPaymentDone: isPaid });
    return response.data;
  } catch (error) {
    console.error(`Error updating payment status for order ${id}:`, error);
    throw new Error(error.response?.data?.message || `Gabim gjatë përditësimit të statusit të pagesës për porosinë ${id}`);
  }
};

/**
 * Update measurement status
 * @param {number} id - Order ID
 * @param {Object} measurementData - Measurement data
 * @returns {Promise} - Promise with updated order data
 */
export const updateMeasurementStatus = async (id, measurementData) => {
  try {
    const response = await api.put(`/orders/${id}/measurement`, measurementData);
    return response.data;
  } catch (error) {
    console.error(`Error updating measurement status for order ${id}:`, error);
    throw new Error(error.response?.data?.message || `Gabim gjatë përditësimit të statusit të matjes për porosinë ${id}`);
  }
};

/**
 * Delete order
 * @param {number} id - Order ID
 * @returns {Promise} - Promise with success message
 */
export const deleteOrder = async (id) => {
  try {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting order ${id}:`, error);
    throw new Error(error.response?.data?.message || `Gabim gjatë fshirjes së porosisë ${id}`);
  }
};

/**
 * Get cash debt orders
 * @returns {Promise} - Promise with orders data
 */
export const getCashDebtOrders = async () => {
  try {
    const response = await api.get('/orders/debts/cash');
    return response.data;
  } catch (error) {
    console.error('Error fetching cash debt orders:', error);
    if (error.response && error.response.status === 401) {
      return [];
    }
    throw new Error(error.response?.data?.message || 'Gabim gjatë ngarkimit të borxheve në kesh');
  }
};

/**
 * Get bank debt orders
 * @returns {Promise} - Promise with orders data
 */
export const getBankDebtOrders = async () => {
  try {
    const response = await api.get('/orders/debts/bank');
    return response.data;
  } catch (error) {
    console.error('Error fetching bank debt orders:', error);
    if (error.response && error.response.status === 401) {
      return [];
    }
    throw new Error(error.response?.data?.message || 'Gabim gjatë ngarkimit të borxheve në bankë');
  }
};

/**
 * Get debt statistics
 * @returns {Promise} - Promise with debt statistics
 */
export const getDebtStatistics = async () => {
  try {
    const response = await api.get('/orders/debts/statistics');
    return response.data;
  } catch (error) {
    console.error('Error fetching debt statistics:', error);
    if (error.response && error.response.status === 401) {
      return {
        cashDebtCount: 0,
        bankDebtCount: 0,
        totalDebtCount: 0,
        totalCashDebt: 0,
        totalBankDebt: 0,
        totalDebt: 0
      };
    }
    throw new Error(error.response?.data?.message || 'Gabim gjatë ngarkimit të statistikave të borxheve');
  }
};

/**
 * Get orders by measurement status
 * @param {string} status - Measurement status
 * @returns {Promise} - Promise with orders data
 */
export const getOrdersByMeasurementStatus = async (status) => {
  try {
    const response = await api.get(`/orders/measurement/${status}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching orders with measurement status ${status}:`, error);
    if (error.response && error.response.status === 401) {
      return [];
    }
    throw new Error(error.response?.data?.message || `Gabim gjatë ngarkimit të porosive me status matje "${status}"`);
  }
}; 