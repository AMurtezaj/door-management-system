const express = require('express');
const router = express.Router();
const debtController = require('../controllers/debtController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get all cash debts with filtering
router.get('/cash', authenticateToken, debtController.getCashDebts);

// Get all bank debts with filtering
router.get('/bank', authenticateToken, debtController.getBankDebts);

// Get all unconfirmed bank payments
router.get('/bank/unconfirmed', authenticateToken, debtController.getUnconfirmedBankPayments);

// Get debt summary
router.get('/summary', authenticateToken, debtController.getDebtSummary);

// Get debt statistics
router.get('/statistics', authenticateToken, debtController.getDebtStatistics);

// Export debts to Excel
router.get('/export/:type', authenticateToken, debtController.exportDebts);

// Generate single debt statement PDF
router.get('/statement/:orderId', authenticateToken, debtController.generateDebtStatement);

// Generate multiple debt statements PDF
router.post('/statements/bulk', authenticateToken, debtController.generateBulkDebtStatements);

module.exports = router; 