import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, getCurrentUser, updateUser } from '../services/authService';
import { useSnackbar } from 'notistack';

// Create the auth context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  // Check if the user is already logged in on page load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Validate token by getting current user
          const userData = await getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token validation error:', error);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await loginUser(credentials);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      enqueueSnackbar('Login successful', { variant: 'success' });
      return response.user;
    } catch (error) {
      enqueueSnackbar(error.message || 'Login failed. Please check your credentials.', { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    enqueueSnackbar('You have been logged out', { variant: 'info' });
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await updateUser(user.id, userData);
      
      // Update the user state with new information
      setUser(prevUser => ({
        ...prevUser,
        ...userData
      }));
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Helper to check if user is admin
  const isAdmin = user?.roli === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        updateProfile,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 