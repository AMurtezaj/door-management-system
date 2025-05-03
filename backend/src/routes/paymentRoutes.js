const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Create new payment
router.post('/', auth, paymentController.createPayment);

// Get all payments
router.get('/', auth, paymentController.getAllPayments);

// Get payments by type
router.get('/type/:menyraPageses', auth, paymentController.getPaymentsByType);

// Get unconfirmed bank payments
router.get('/unconfirmed', auth, paymentController.getUnconfirmedBankPayments);

// Confirm bank payment
router.put('/:id/confirm', auth, isAdmin, paymentController.confirmBankPayment);

// Delete payment (admin only)
router.delete('/:id', auth, isAdmin, paymentController.deletePayment);

module.exports = router; 