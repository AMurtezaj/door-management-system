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

// New routes for user management
router.get('/:id', auth, isAdmin, userController.getUserById);
router.put('/:id', auth, isAdmin, userController.updateUser);
router.delete('/:id', auth, isAdmin, userController.deleteUser);

module.exports = router; 