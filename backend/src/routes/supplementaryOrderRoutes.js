const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const supplementaryOrderController = require('../controllers/supplementaryOrderController');

// Create new supplementary order
router.post('/', auth, supplementaryOrderController.createSupplementaryOrder);

// Get supplementary orders by parent order ID
router.get('/parent/:parentOrderId', auth, supplementaryOrderController.getSupplementaryOrdersByParentId);

// Get supplementary order by ID
router.get('/:id', auth, supplementaryOrderController.getSupplementaryOrderById);

// Update supplementary order
router.put('/:id', auth, supplementaryOrderController.updateSupplementaryOrder);

// Update payment status
router.patch('/:id/payment-status', auth, supplementaryOrderController.updateSupplementaryOrderPaymentStatus);

// Add partial payment to supplementary order
router.post('/:id/partial-payment', auth, supplementaryOrderController.addPartialPaymentToSupplementaryOrder);

// Update product status
router.patch('/:id/product-status', auth, supplementaryOrderController.updateSupplementaryOrderProductStatus);

// Delete supplementary order (admin only)
router.delete('/:id', auth, isAdmin, supplementaryOrderController.deleteSupplementaryOrder);

module.exports = router; 