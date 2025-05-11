import api from './api';

// Merr të gjithë përdoruesit
export const merrPerdoruesit = async () => {
  try {
    return await api.get('/users');
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Shto përdorues të ri
export const shtoPerdorues = async (teDhenat) => {
  try {
    return await api.post('/users/register', teDhenat);
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

// Përditëso përdorues
export const perditesoPerdorues = async (id, teDhenat) => {
  try {
    return await api.put(`/users/${id}`, teDhenat);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Fshi përdorues
export const fshiPerdorues = async (id) => {
  try {
    return await api.delete(`/users/${id}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Merr profilin e përdoruesit
export const merrProfilin = async () => {
  try {
    console.log('Fetching user profile...');
    const userData = await api.get('/users/me');
    console.log('Profile data received:', userData);
    return userData;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id) => {
  try {
    return await api.get(`/users/${id}`);
  } catch (error) {
    console.error(`Error fetching user with id ${id}:`, error);
    throw error;
  }
};

// Login user
export const login = async (credentials) => {
  try {
    console.log('Sending login request with credentials:', { email: credentials.email });
    const response = await api.post('/users/login', credentials);
    console.log('Raw login response:', response);
    
    // api.js already returns the data property from the response
    // so we don't need to do response.data
    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

// Create new user
export const createUser = async (userData) => {
  try {
    return await api.post('/users', userData);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update user
export const updateUser = async (id, userData) => {
  try {
    return await api.put(`/users/${id}`, userData);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (id) => {
  try {
    return await api.delete(`/users/${id}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Register user
export const register = async (userData) => {
  try {
    return await api.post('/users/register', userData);
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}; 