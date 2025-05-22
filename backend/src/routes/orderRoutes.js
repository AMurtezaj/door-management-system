const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// Create new order
router.post('/', auth, orderController.createOrder);

// Get all orders
router.get('/', auth, orderController.getAllOrders);

// Get orders by day
router.get('/day/:dita', auth, orderController.getOrdersByDay);

// Get cash debt orders
router.get('/debts/cash', auth, orderController.getCashDebtOrders);

// Get bank debt orders
router.get('/debts/bank', auth, orderController.getBankDebtOrders);

// Get debt statistics
router.get('/debts/statistics', auth, orderController.getDebtStatistics);

// Get order by ID
router.get('/:id', auth, orderController.getOrderById);

// Update order
router.put('/:id', auth, orderController.updateOrder);

// Update payment status
router.patch('/:id/payment-status', auth, orderController.updatePaymentStatus);

// Delete order (admin only)
router.delete('/:id', auth, isAdmin, orderController.deleteOrder);

// Measurement status routes
router.put('/:id/measurement', auth, orderController.updateMeasurementStatus);
router.get('/measurement/:statusiMatjes', auth, orderController.getOrdersByMeasurementStatus);

// Update print status
router.patch('/:id/print-status', auth, orderController.updatePrintStatus);

module.exports = router; 