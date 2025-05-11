import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { Search, Add, Edit, Delete, Visibility, Receipt } from '@mui/icons-material';
import { paymentService } from '../services/paymentService';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const Payments = () => {
  const { isAdmin } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [orders, setOrders] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    orderId: '',
    amount: '',
    method: 'cash',
    status: 'completed',
    description: ''
  });

  // Fetch payments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const paymentsData = await paymentService.getPayments();
        const ordersData = await orderService.getOrders();
        
        setPayments(paymentsData);
        setFilteredPayments(paymentsData);
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load payments');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter payments based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPayments(payments);
      return;
    }

    const filtered = payments.filter(payment => 
      payment.id.toString().includes(searchTerm) ||
      payment.orderId.toString().includes(searchTerm) ||
      payment.amount.toString().includes(searchTerm) ||
      payment.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredPayments(filtered);
    setPage(0);
  }, [searchTerm, payments]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (payment = null) => {
    if (payment) {
      setSelectedPayment(payment);
      setPaymentForm({
        orderId: payment.orderId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        description: payment.description || ''
      });
    } else {
      setSelectedPayment(null);
      setPaymentForm({
        orderId: '',
        amount: '',
        method: 'cash',
        status: 'completed',
        description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm({
      ...paymentForm,
      [name]: value
    });
  };

  const handleSavePayment = async () => {
    try {
      if (paymentForm.amount <= 0) {
        toast.error('Amount must be greater than 0');
        return;
      }

      if (!paymentForm.orderId) {
        toast.error('Please select an order');
        return;
      }

      setLoading(true);
      
      if (selectedPayment) {
        // Update existing payment
        await paymentService.updatePayment(selectedPayment.id, paymentForm);
        
        // Update local state
        setPayments(payments.map(p => 
          p.id === selectedPayment.id ? { ...p, ...paymentForm } : p
        ));
        
        toast.success('Payment updated successfully');
      } else {
        // Create new payment
        const newPayment = await paymentService.createPayment(paymentForm);
        
        // Update local state
        setPayments([newPayment, ...payments]);
        
        toast.success('Payment created successfully');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error('Failed to save payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return;
    }
    
    try {
      setLoading(true);
      await paymentService.deletePayment(paymentId);
      
      // Update local state
      setPayments(payments.filter(p => p.id !== paymentId));
      
      toast.success('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChipColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Payments Management
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          placeholder="Search payments..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        
        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            New Payment
          </Button>
        )}
      </Box>
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading && payments.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Payment ID</TableCell>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">No payments found</TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((payment) => (
                        <TableRow key={payment.id} hover>
                          <TableCell>{payment.id}</TableCell>
                          <TableCell>{payment.orderId}</TableCell>
                          <TableCell>${payment.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip 
                              icon={<Receipt />} 
                              label={payment.method}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={payment.status}
                              size="small"
                              color={getStatusChipColor(payment.status)}
                            />
                          </TableCell>
                          <TableCell>
                            {format(new Date(payment.createdAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => {/* View payment details */}}
                              >
                                View
                              </Button>
                              
                              {isAdmin && (
                                <>
                                  <Button
                                    size="small"
                                    startIcon={<Edit />}
                                    onClick={() => handleOpenDialog(payment)}
                                    sx={{ ml: 1 }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="small"
                                    color="error"
                                    startIcon={<Delete />}
                                    onClick={() => handleDeletePayment(payment.id)}
                                    sx={{ ml: 1 }}
                                  >
                                    Delete
                                  </Button>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredPayments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
      
      {/* Payment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedPayment ? 'Edit Payment' : 'Create New Payment'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Order</InputLabel>
                <Select
                  name="orderId"
                  value={paymentForm.orderId}
                  onChange={handleFormChange}
                  label="Order"
                >
                  {orders.map(order => (
                    <MenuItem key={order.id} value={order.id}>
                      #{order.id} - ${order.totalPrice || 0}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={paymentForm.amount}
                onChange={handleFormChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="method"
                  value={paymentForm.method}
                  onChange={handleFormChange}
                  label="Payment Method"
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="credit_card">Credit Card</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="check">Check</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={paymentForm.status}
                  onChange={handleFormChange}
                  label="Status"
                >
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={3}
                value={paymentForm.description}
                onChange={handleFormChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSavePayment} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payments; 