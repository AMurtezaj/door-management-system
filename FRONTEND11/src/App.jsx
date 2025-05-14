import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import DoorsPage from './pages/DoorsPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import DoorDetail from './components/doors/DoorDetail';
import DoorForm from './components/doors/DoorForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Door Management */}
          <Route path="/doors" element={<DoorsPage />} />
          <Route path="/doors/new" element={<DoorForm />} />
          <Route path="/doors/:id" element={<DoorDetail />} />
          <Route path="/doors/:id/edit" element={<DoorForm />} />
          
          {/* User Profile (all users) */}
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Admin-only routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/access" element={<div>Access Control Page</div>} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/settings" element={<div>Settings Page</div>} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App; 