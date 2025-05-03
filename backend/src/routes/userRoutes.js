const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Register new user (admin only)
router.post('/register', auth, isAdmin, userController.register);

// Login
router.post('/login', userController.login);

// Get current user
router.get('/me', auth, userController.getCurrentUser);

module.exports = router; 