import api from './apiService';

// Get all complaints
export const getAllComplaints = async () => {
  try {
    const response = await api.get('/complaints');
    return response.data;
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw new Error(error.response?.data?.error || 'Gabim gjatë marrjes së ankesave');
  }
};

// Get complaints by status
export const getComplaintsByStatus = async (status) => {
  try {
    const response = await api.get(`/complaints/status/${status}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching complaints by status:', error);
    throw new Error(error.response?.data?.error || 'Gabim gjatë marrjes së ankesave');
  }
};

// Get complaint statistics
export const getComplaintStatistics = async () => {
  try {
    const response = await api.get('/complaints/statistics');
    return response.data;
  } catch (error) {
    console.error('Error fetching complaint statistics:', error);
    throw new Error(error.response?.data?.error || 'Gabim gjatë marrjes së statistikave');
  }
};

// Create a new complaint
export const createComplaint = async (pershkrimi) => {
  try {
    const response = await api.post('/complaints', { pershkrimi });
    return response.data;
  } catch (error) {
    console.error('Error creating complaint:', error);
    throw new Error(error.response?.data?.error || 'Gabim gjatë krijimit të ankesës');
  }
};

// Update complaint status
export const updateComplaintStatus = async (id, statusi) => {
  try {
    const response = await api.patch(`/complaints/${id}/status`, { statusi });
    return response.data;
  } catch (error) {
    console.error('Error updating complaint status:', error);
    throw new Error(error.response?.data?.error || 'Gabim gjatë përditësimit të statusit');
  }
};

// Delete complaint
export const deleteComplaint = async (id) => {
  try {
    const response = await api.delete(`/complaints/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting complaint:', error);
    throw new Error(error.response?.data?.error || 'Gabim gjatë fshirjes së ankesës');
  }
}; 