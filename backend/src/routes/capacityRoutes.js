const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const capacityController = require('../controllers/capacityController');

// Set daily capacity (admin only)
router.post('/', auth, isAdmin, capacityController.setCapacity);

// Get all daily capacities
router.get('/', auth, capacityController.getAllCapacities);

// Get capacity by day
router.get('/:dita', auth, capacityController.getCapacityByDay);

// Update capacity (admin only)
router.put('/:id', auth, isAdmin, capacityController.updateCapacity);

module.exports = router; 