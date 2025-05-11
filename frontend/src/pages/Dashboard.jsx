import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Paper, CircularProgress, Divider } from '@mui/material';
import { ShoppingCart, Payment, People, Today, DoNotDisturb, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon, color }) => (
  <Card elevation={3} sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ mr: 2, backgroundColor: `${color}.100`, p: 1, borderRadius: 1 }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" fontWeight="bold">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalUsers: 0,
    totalPayments: 0,
    todayOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch orders
        const orders = await orderService.getOrders();
        
        // Example data processing (replace with real data processing)
        const today = new Date();
        const todayString = format(today, 'yyyy-MM-dd');
        
        const pending = orders.filter(order => order.status === 'pending').length;
        const completed = orders.filter(order => order.status === 'completed').length;
        const todaysOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return format(orderDate, 'yyyy-MM-dd') === todayString;
        }).length;
        
        // Calculate total payments (example)
        const totalPaymentsValue = orders.reduce((sum, order) => {
          return sum + (order.totalPrice || 0);
        }, 0);
        
        setStats({
          totalOrders: orders.length,
          pendingOrders: pending,
          completedOrders: completed,
          totalUsers: 10, // This would come from a user API call
          totalPayments: totalPaymentsValue,
          todayOrders: todaysOrders
        });
        
        // Get recent orders
        setRecentOrders(orders.slice(0, 5));
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Dashboard
      </Typography>
      
      <Typography variant="h6" gutterBottom>
        Welcome back, {user?.emri} {user?.mbiemri}!
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4, mt: 1 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard 
            title="Total Orders" 
            value={stats.totalOrders}
            icon={<ShoppingCart sx={{ color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard 
            title="Pending Orders" 
            value={stats.pendingOrders}
            icon={<DoNotDisturb sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard 
            title="Completed Orders" 
            value={stats.completedOrders}
            icon={<CheckCircle sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard 
            title="Today's Orders" 
            value={stats.todayOrders}
            icon={<Today sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>
        {isAdmin && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard 
                title="Total Users" 
                value={stats.totalUsers}
                icon={<People sx={{ color: 'secondary.main' }} />}
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard 
                title="Total Payments" 
                value={`$${stats.totalPayments.toFixed(2)}`}
                icon={<Payment sx={{ color: 'success.main' }} />}
                color="success"
              />
            </Grid>
          </>
        )}
      </Grid>
      
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Recent Orders
      </Typography>
      
      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        {recentOrders.length > 0 ? (
          recentOrders.map((order, index) => (
            <React.Fragment key={order.id}>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Order ID
                    </Typography>
                    <Typography variant="body1">
                      #{order.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Customer
                    </Typography>
                    <Typography variant="body1">
                      {order.customerName || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'inline-block',
                        bgcolor: 
                          order.status === 'completed' ? 'success.100' : 
                          order.status === 'pending' ? 'warning.100' : 
                          'info.100',
                        color: 
                          order.status === 'completed' ? 'success.main' : 
                          order.status === 'pending' ? 'warning.main' : 
                          'info.main',
                      }}
                    >
                      <Typography variant="body2">
                        {order.status}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Amount
                    </Typography>
                    <Typography variant="body1">
                      ${order.totalPrice?.toFixed(2) || '0.00'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              {index < recentOrders.length - 1 && <Divider />}
            </React.Fragment>
          ))
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No recent orders found
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard; 