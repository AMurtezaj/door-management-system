import api from './apiService';

/**
 * Create a new supplementary order
 * @param {Object} supplementaryOrderData - Supplementary order data
 * @returns {Promise} - Promise with created supplementary order data
 */
export const createSupplementaryOrder = async (supplementaryOrderData) => {
  try {
    const response = await api.post('/supplementary-orders', supplementaryOrderData);
    return response.data;
  } catch (error) {
    console.error('Error creating supplementary order:', error);
    throw new Error(error.response?.data?.message || 'Gabim gjatë krijimit të porosisë shtesë');
  }
};

/**
 * Get supplementary orders by parent order ID
 * @param {number} parentOrderId - Parent order ID
 * @returns {Promise} - Promise with supplementary orders data
 */
export const getSupplementaryOrdersByParentId = async (parentOrderId) => {
  try {
    const response = await api.get(`/supplementary-orders/parent/${parentOrderId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching supplementary orders for parent ${parentOrderId}:`, error);
    if (error.response && error.response.status === 401) {
      return { data: [] };
    }
    throw new Error(error.response?.data?.message || `Gabim gjatë ngarkimit të porosive shtesë për porosinë ${parentOrderId}`);
  }
};

/**
 * Get supplementary order by ID
 * @param {number} id - Supplementary order ID
 * @returns {Promise} - Promise with supplementary order data
 */
export const getSupplementaryOrderById = async (id) => {
  try {
    const response = await api.get(`/supplementary-orders/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching supplementary order ${id}:`, error);
    throw new Error(error.response?.data?.message || `Gabim gjatë ngarkimit të porosisë shtesë ${id}`);
  }
};

/**
 * Update supplementary order
 * @param {number} id - Supplementary order ID
 * @param {Object} updateData - Updated supplementary order data
 * @returns {Promise} - Promise with updated supplementary order data
 */
export const updateSupplementaryOrder = async (id, updateData) => {
  try {
    const response = await api.put(`/supplementary-orders/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Error updating supplementary order ${id}:`, error);
    throw new Error(error.response?.data?.message || `Gabim gjatë përditësimit të porosisë shtesë ${id}`);
  }
};

/**
 * Update payment status of supplementary order
 * @param {number} id - Supplementary order ID
 * @param {boolean} isPaymentDone - Payment status
 * @returns {Promise} - Promise with updated supplementary order data
 */
export const updateSupplementaryOrderPaymentStatus = async (id, isPaymentDone) => {
  try {
    const response = await api.patch(`/supplementary-orders/${id}/payment-status`, { isPaymentDone });
    return response.data;
  } catch (error) {
    console.error(`Error updating supplementary order payment status for ${id}:`, error);
    throw new Error(error.response?.data?.message || `Gabim gjatë përditësimit të statusit të pagesës për porosinë shtesë ${id}`);
  }
};

/**
 * Add partial payment to supplementary order
 * @param {number} id - Supplementary order ID
 * @param {number} paymentAmount - Amount to pay
 * @param {string} paymentReceiver - Person who received the payment
 * @returns {Promise} - Promise with updated supplementary order data
 */
export const addPartialPaymentToSupplementaryOrder = async (id, paymentAmount, paymentReceiver) => {
  try {
    const response = await api.post(`/supplementary-orders/${id}/partial-payment`, { 
      paymentAmount: parseFloat(paymentAmount),
      paymentReceiver 
    });
    return {
      supplementaryOrder: response.data.data,
      message: response.data.message
    };
  } catch (error) {
    console.error(`Error adding partial payment for supplementary order ${id}:`, error);
    throw new Error(error.response?.data?.message || `Gabim gjatë regjistrimit të pagesës për porosinë shtesë ${id}`);
  }
};

/**
 * Delete supplementary order
 * @param {number} id - Supplementary order ID
 * @returns {Promise} - Promise with success message
 */
export const deleteSupplementaryOrder = async (id) => {
  try {
    const response = await api.delete(`/supplementary-orders/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting supplementary order ${id}:`, error);
    throw new Error(error.response?.data?.message || `Gabim gjatë fshirjes së porosisë shtesë ${id}`);
  }
};

export const cancelPartialPaymentFromSupplementaryOrder = async (id, cancellationAmount) => {
  try {
    const response = await api.post(`/supplementary-orders/${id}/cancel-payment`, { 
      cancellationAmount 
    });
    return response.data;
  } catch (error) {
    console.error(`Error cancelling partial payment for supplementary order ${id}:`, error);
    throw new Error(error.response?.data?.message || 'Ka ndodhur një gabim gjatë anulimit të pagesës');
  }
};

/**
 * Mark supplementary order as printed
 * @param {number} id - Supplementary order ID
 * @returns {Promise} - Promise with updated supplementary order data
 */
export const markSupplementaryOrderAsPrinted = async (id) => {
  try {
    const response = await api.patch(`/supplementary-orders/${id}/mark-printed`);
    return response.data;
  } catch (error) {
    console.error(`Error marking supplementary order ${id} as printed:`, error);
    throw new Error(error.response?.data?.message || `Gabim gjatë shënimit të porosisë shtesë ${id} si e printuar`);
  }
}; 