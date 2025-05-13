import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Component for protecting routes that require authentication
const RequireAuth = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If roles are specified and user's role is not in the allowed roles, redirect to unauthorized
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.roli)) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }
  
  // If authenticated and authorized, render the protected component
  return children;
};

export default RequireAuth; 