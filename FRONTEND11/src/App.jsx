import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import OrderList from './components/orders/OrderList';
import OrderForm from './components/orders/OrderForm';
import OrderEdit from './components/orders/OrderEdit';
import CapacityManagement from './components/orders/CapacityManagement';
import DebtManagementPage from './pages/DebtManagementPage';
import MeasurementStatusPage from './pages/MeasurementStatusPage';
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
          
          {/* Order Management */}
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/new" element={<OrderForm />} />
          <Route path="/orders/edit/:id" element={<OrderEdit />} />
          <Route path="/orders/capacity" element={<CapacityManagement />} />
          
          {/* Specialized Order Features */}
          <Route path="/debt-management" element={<DebtManagementPage />} />
          <Route path="/measurement-status" element={<MeasurementStatusPage />} />
          
          {/* User Profile (all users) */}
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Admin-only routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
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