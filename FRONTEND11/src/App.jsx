import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import OrderList from './components/orders/OrderList';
import OrderForm from './components/orders/OrderForm';
import OrderEdit from './components/orders/OrderEdit';
import CapacityManagement from './components/orders/CapacityManagement';
import AdditionalOrdersPage from './components/orders/AdditionalOrdersPage';
import UnmeasuredOrdersList from './components/orders/UnmeasuredOrdersList';
import DebtManagementPage from './pages/DebtManagementPage';
import MeasurementStatusPage from './pages/MeasurementStatusPage';
import QRVerification from './components/verification/QRVerification';
import QRScanner from './components/verification/QRScanner';
import QRDebug from './components/verification/QRDebug';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route path="/verify" element={<QRVerification />} />
      <Route path="/scan" element={<QRScanner />} />
      <Route path="/debug" element={<QRDebug />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Order Management */}
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/new" element={<OrderForm />} />
          <Route path="/orders/edit/:id" element={<OrderEdit />} />
          <Route path="/orders/additional" element={<AdditionalOrdersPage />} />
          <Route path="/orders/capacity" element={<CapacityManagement />} />
          <Route path="/orders/unmeasured" element={<UnmeasuredOrdersList />} />
          
          {/* Specialized Order Features */}
          <Route path="/debt-management" element={<DebtManagementPage />} />
          <Route path="/measurement-status" element={<MeasurementStatusPage />} />
          
          {/* Notifications */}
          <Route path="/notifications" element={<NotificationsPage />} />
          
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