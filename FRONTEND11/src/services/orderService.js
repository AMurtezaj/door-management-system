import api from './apiService';

/**
 * Format order data to maintain backward compatibility with frontend
 * @param {Object} order - Order data with nested Customer, Payment, and OrderDetails
 * @returns {Object} - Flattened order data with all properties at the top level
 */
const formatOrderResponse = (order) => {
  if (!order) return null;
  
  // Create a shallow copy of the order
  const formattedOrder = { ...order };
  
  // Add Customer properties
  if (order.Customer) {
    formattedOrder.emriKlientit = order.Customer.emri;
    formattedOrder.mbiemriKlientit = order.Customer.mbiemri;
    formattedOrder.numriTelefonit = order.Customer.telefoni;
    formattedOrder.vendi = order.Customer.vendi;
  }
  
  // Add Payment properties
  if (order.Payment) {
    formattedOrder.cmimiTotal = order.Payment.cmimiTotal;
    formattedOrder.kaparja = order.Payment.kaparja;
    formattedOrder.kaparaReceiver = order.Payment.kaparaReceiver;
    formattedOrder.menyraPageses = order.Payment.menyraPageses;
    formattedOrder.isPaymentDone = order.Payment.isPaymentDone;
    formattedOrder.debtType = order.Payment.debtType;
    formattedOrder.pagesaMbetur = order.Payment.pagesaMbetur;
  }
  
  // Add OrderDetails properties
  if (order.OrderDetails) {
    formattedOrder.matesi = order.OrderDetails.matesi;
    formattedOrder.dataMatjes = order.OrderDetails.dataMatjes;
    formattedOrder.sender = order.OrderDetails.sender || '';
    formattedOrder.installer = order.OrderDetails.installer || '';
    formattedOrder.dita = order.OrderDetails.dita;
    formattedOrder.statusi = order.OrderDetails.statusi;
    formattedOrder.eshtePrintuar = order.OrderDetails.eshtePrintuar;
    formattedOrder.kaVule = order.OrderDetails.kaVule;
    formattedOrder.statusiMatjes = order.OrderDetails.statusiMatjes;
  } else {
    // Ensure we always have these fields, even if OrderDetails is missing
    formattedOrder.sender = '';
    formattedOrder.installer = '';
    formattedOrder.dita = null;
  }
  
  // Debug the formatted order
  console.log('Formatted order:', {
    id: formattedOrder.id,
    sender: formattedOrder.sender,
    installer: formattedOrder.installer,
    dita: formattedOrder.dita
  });
  
  return formattedOrder;
};

/**
 * Format array of orders to maintain backward compatibility
 * @param {Array} orders - Array of order data
 * @returns {Array} - Array of flattened order data
 */
const formatOrdersResponse = (orders) => {
  if (!Array.isArray(orders)) return [];
  return orders.map(order => formatOrderResponse(order));
};

/**
 * This is an internal function that doesn't need to be exposed to users of this service.
 * When we send data to the server, we'll still use the flat structure that the backend expects.
 * Our server-side code will handle this properly.
 * 
 * The reason we can continue using the flat structure is because in our orderController's 
 * createOrder and updateOrder methods in the backend, we are accepting that flat structure 
 * and reconstructing the nested models behind the scenes with the service layer.
 */

/**
 * Get all orders
 * @returns {Promise} - Promise with orders data
 */
export const getAllOrders = async () => {
  try {
    const response = await api.get('/orders');
    return formatOrdersResponse(response.data);
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
    return formatOrderResponse(response.data);
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
    return formatOrdersResponse(response.data);
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
    return formatOrderResponse(response.data);
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
    return formatOrderResponse(response.data);
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
    return formatOrderResponse(response.data);
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
    return formatOrderResponse(response.data);
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
    return formatOrdersResponse(response.data);
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
    return formatOrdersResponse(response.data);
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
    return formatOrdersResponse(response.data);
  } catch (error) {
    console.error(`Error fetching orders with measurement status ${status}:`, error);
    if (error.response && error.response.status === 401) {
      return [];
    }
    throw new Error(error.response?.data?.message || `Gabim gjatë ngarkimit të porosive me status matje "${status}"`);
  }
};

/**
 * Update the print status of an order
 * @param {number} id - Order ID
 * @returns {Promise} - Promise with updated order data
 */
export const updateOrderPrintStatus = async (id) => {
  try {
    const response = await api.patch(`/orders/${id}/print-status`, { eshtePrintuar: true });
    return formatOrderResponse(response.data);
  } catch (error) {
    console.error(`Error updating print status for order ${id}:`, error);
    throw new Error(error.response?.data?.message || `Gabim gjatë përditësimit të statusit të printimit për porosinë ${id}`);
  }
}; 