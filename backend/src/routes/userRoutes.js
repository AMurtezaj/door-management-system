const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Create first admin (no auth required) - must be first!
router.post('/first-admin', userController.createFirstAdmin);

// Protected routes
router.post('/register', auth, isAdmin, userController.register);
router.post('/login', userController.login);
router.get('/me', auth, userController.getCurrentUser);
router.get('/', auth, isAdmin, userController.getAllUsers);

module.exports = router; 