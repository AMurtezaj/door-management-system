import api from './apiService';

/**
 * Get all capacities
 * @returns {Promise} - Promise with capacities data
 */
export const getAllCapacities = async () => {
  try {
    const response = await api.get('/capacities');
    return response.data;
  } catch (error) {
    console.error('Error fetching capacities:', error);
    if (error.response && error.response.status === 401) {
      // Auth error is handled by apiService interceptor
      return [];
    }
    throw error;
  }
};

/**
 * Get capacity by day
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise} - Promise with capacity data
 */
export const getCapacityByDay = async (date) => {
  try {
    const response = await api.get(`/capacities/${date}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching capacity for ${date}:`, error);
    throw error;
  }
};

/**
 * Set capacity for a day
 * @param {Object} capacityData - Capacity data
 * @returns {Promise} - Promise with created/updated capacity data
 */
export const setCapacity = async (capacityData) => {
  try {
    const response = await api.post('/capacities', capacityData);
    return response.data;
  } catch (error) {
    console.error('Error setting capacity:', error);
    throw error;
  }
};

/**
 * Update capacity
 * @param {number} id - Capacity ID
 * @param {Object} capacityData - Updated capacity data
 * @returns {Promise} - Promise with updated capacity data
 */
export const updateCapacity = async (id, capacityData) => {
  try {
    const response = await api.put(`/capacities/${id}`, capacityData);
    return response.data;
  } catch (error) {
    console.error(`Error updating capacity ${id}:`, error);
    throw error;
  }
};

/**
 * Delete capacity
 * @param {number} id - Capacity ID
 * @returns {Promise} - Promise with success message
 */
export const deleteCapacity = async (id) => {
  try {
    const response = await api.delete(`/capacities/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting capacity ${id}:`, error);
    throw error;
  }
}; 