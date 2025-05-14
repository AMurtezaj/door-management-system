import api from './apiService';

// Get all doors
export const getAllDoors = async () => {
  try {
    const response = await api.get('/doors');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch doors');
  }
};

// Get door by ID
export const getDoorById = async (id) => {
  try {
    const response = await api.get(`/doors/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch door details');
  }
};

// Create new door
export const createDoor = async (doorData) => {
  try {
    const response = await api.post('/doors', doorData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create door');
  }
};

// Update door
export const updateDoor = async (id, doorData) => {
  try {
    const response = await api.put(`/doors/${id}`, doorData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update door');
  }
};

// Delete door
export const deleteDoor = async (id) => {
  try {
    const response = await api.delete(`/doors/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete door');
  }
};

// Change door status (open, close, lock)
export const changeDoorStatus = async (id, status) => {
  try {
    const response = await api.patch(`/doors/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to change door status');
  }
};

// Grant access to user for a door
export const grantAccess = async (doorId, userId, permissions) => {
  try {
    const response = await api.post(`/doors/${doorId}/access`, { userId, permissions });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to grant access');
  }
};

// Revoke access from user for a door
export const revokeAccess = async (doorId, userId) => {
  try {
    const response = await api.delete(`/doors/${doorId}/access/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to revoke access');
  }
};

// Get door access history/logs
export const getDoorLogs = async (doorId, params = {}) => {
  try {
    const response = await api.get(`/doors/${doorId}/logs`, { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch door logs');
  }
}; 