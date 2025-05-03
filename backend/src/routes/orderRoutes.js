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

// Get order by ID
router.get('/:id', auth, orderController.getOrderById);

// Update order
router.put('/:id', auth, orderController.updateOrder);

// Mark order as printed
router.put('/:id/print', auth, orderController.markAsPrinted);

// Mark order with seal
router.put('/:id/seal', auth, orderController.markWithSeal);

// Get orders by status
router.get('/status/:statusi', auth, orderController.getOrdersByStatus);

// Get orders by payment type
router.get('/payment/:menyraPageses', auth, orderController.getOrdersByPaymentType);

// Delete order (admin only)
router.delete('/:id', auth, isAdmin, orderController.deleteOrder);

module.exports = router; 