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

// Delete order (admin only)
router.delete('/:id', auth, isAdmin, orderController.deleteOrder);

// Measurement status routes
router.put('/:id/measurement', auth, orderController.updateMeasurementStatus);
router.get('/measurement/:statusiMatjes', auth, orderController.getOrdersByMeasurementStatus);

module.exports = router; 