import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, merrProfilin } from '../services/userService';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on initial load
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await merrProfilin();
          setUser(userData);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login function
  const loginUser = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await login(credentials);
      
      // Log the response to understand its structure
      console.log('Login response:', response);
      
      // Handle different response structures
      let token, userData;
      
      if (response.token && response.user) {
        // Direct structure: { token, user }
        token = response.token;
        userData = response.user;
      } else if (response.data && response.data.token) {
        // Nested structure: { data: { token, user } }
        token = response.data.token;
        userData = response.data.user;
      } else {
        // Fallback - might be just the token with user info embedded
        token = response;
        userData = null;
      }
      
      if (!token) {
        throw new Error('Invalid response format from server');
      }
      
      // Save token and user info
      localStorage.setItem('token', token);
      
      // If we didn't get user data but got a token, fetch the profile
      if (!userData && token) {
        try {
          userData = await merrProfilin();
        } catch (profileErr) {
          console.error('Failed to fetch user profile after login:', profileErr);
        }
      }
      
      setUser(userData);
      toast.success('Logged in successfully!');
      return userData;
    } catch (err) {
      console.error('Login error details:', err);
      setError(err.response?.data?.message || 'Login failed');
      toast.error(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.info('Logged out successfully');
  };

  // Check if user is admin
  const isAdmin = user?.roli === 'admin';
  
  // Check if user is manager
  const isManager = user?.roli === 'manager';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginUser,
        logout,
        isAdmin,
        isManager,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 