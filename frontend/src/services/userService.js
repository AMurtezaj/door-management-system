import api from './api';

// Get all users (admin only)
export const merrPerdoruesit = async () => {
  try {
    console.log('Fetching all users');
    return await api.get('/users');
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get user profile (current logged in user)
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

// Get user by ID (admin only)
export const getUserById = async (id) => {
  try {
    console.log(`Fetching user with ID: ${id}`);
    return await api.get(`/users/${id}`);
  } catch (error) {
    console.error(`Error fetching user with id ${id}:`, error);
    throw error;
  }
};

// Create new user (admin only)
export const createUser = async (userData) => {
  try {
    console.log('Creating new user:', userData.email);
    return await api.post('/users/register', userData);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update user (admin only)
export const updateUser = async (id, userData) => {
  try {
    console.log(`Updating user with ID: ${id}`, userData);
    return await api.put(`/users/${id}`, userData);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user (admin only)
export const deleteUser = async (id) => {
  try {
    console.log(`Deleting user with ID: ${id}`);
    return await api.delete(`/users/${id}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Login user
export const login = async (credentials) => {
  try {
    console.log('Sending login request with credentials:', { email: credentials.email });
    const response = await api.post('/users/login', credentials);
    console.log('Raw login response:', response);
    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

// Albanian-named functions for backward compatibility
export const shtoPerdorues = createUser;
export const perditesoPerdorues = updateUser;
export const fshiPerdorues = deleteUser; 