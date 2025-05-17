import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // Check auth status function as a callback so we can reuse it
  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          console.log('Validating token...');
          // Make sure token is properly formatted before validating
          localStorage.setItem('token', token.startsWith('Bearer ') ? token : `Bearer ${token}`);
          // Validate token by getting current user
          const userData = await getCurrentUser();
          console.log('Token valid, user data:', userData);
          setUser(userData);
          setIsAuthenticated(true);
          return true;
        } catch (error) {
          console.error('Token validation error:', error);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
          
          // Only show warning if we were previously authenticated
          if (isAuthenticated) {
            enqueueSnackbar('Sesioni juaj ka skaduar. Ju lutem identifikohuni përsëri.', { 
              variant: 'warning' 
            });
          }
          return false;
        }
      } else {
        console.log('No token found');
        setIsAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }, [enqueueSnackbar, isAuthenticated]);

  // Check if the user is already logged in on page load
  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuthStatus();
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [checkAuthStatus]);

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    try {
      console.log('Attempting login...');
      const response = await loginUser(credentials);
      console.log('Login successful');
      
      // Ensure token is formatted with Bearer prefix
      const token = response.token;
      localStorage.setItem('token', token.startsWith('Bearer ') ? token : `Bearer ${token}`);
      
      setUser(response.user);
      setIsAuthenticated(true);
      enqueueSnackbar('Login successful', { variant: 'success' });
      return response.user;
    } catch (error) {
      console.error('Login error:', error);
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

  // Refresh authentication
  const refreshAuth = async () => {
    setLoading(true);
    try {
      console.log('Refreshing authentication...');
      
      // Ensure token is properly formatted if it exists
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.setItem('token', token.startsWith('Bearer ') ? token : `Bearer ${token}`);
      }
      
      const success = await checkAuthStatus();
      if (success) {
        console.log('Authentication refreshed successfully');
        enqueueSnackbar('Sesioni u rifreskua me sukses', { variant: 'success' });
      } else {
        console.log('Authentication refresh failed');
        enqueueSnackbar('Nuk mund të rifreskohej sesioni', { variant: 'error' });
      }
      return success;
    } catch (error) {
      console.error('Authentication refresh error:', error);
      enqueueSnackbar('Rifreskimi i sesionit dështoi', { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
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
        refreshAuth,
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