const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

// Get all notifications
router.get('/', auth, notificationController.getAllNotifications);

// Get unread notifications
router.get('/unread', auth, notificationController.getUnreadNotifications);

// Get unread notifications count
router.get('/unread/count', auth, notificationController.getUnreadCount);

// Mark notification as read (support both PUT and PATCH)
router.put('/:id/read', auth, notificationController.markAsRead);
router.patch('/:id/read', auth, notificationController.markAsRead);

// Mark all notifications as read (support both PUT and PATCH)
router.put('/read-all', auth, notificationController.markAllAsRead);
router.patch('/read-all', auth, notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', auth, notificationController.deleteNotification);

module.exports = router; 