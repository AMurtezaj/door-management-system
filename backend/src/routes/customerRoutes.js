const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const customerController = require('../controllers/customerController');

// Get all customers
router.get('/', auth, customerController.getAllCustomers);

// Search customers
router.get('/search', auth, customerController.searchCustomers);

// Get customer by ID
router.get('/:id', auth, customerController.getCustomerById);

// Create new customer
router.post('/', auth, customerController.createCustomer);

// Update customer
router.put('/:id', auth, customerController.updateCustomer);

// Delete customer (admin only)
router.delete('/:id', auth, isAdmin, customerController.deleteCustomer);

module.exports = router; 