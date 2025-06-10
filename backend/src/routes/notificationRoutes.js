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

// ====== SCHEDULED NOTIFICATION ROUTES ======

// Get status of scheduled notification jobs
router.get('/scheduled/status', auth, notificationController.getScheduledJobsStatus);

// Manually trigger overdue orders check (for testing)
router.post('/scheduled/trigger/overdue', auth, notificationController.triggerOverdueCheck);

// Manually trigger monthly debt report (for testing)
router.post('/scheduled/trigger/debt-report', auth, notificationController.triggerDebtReport);

// Initialize scheduled notification jobs
router.post('/scheduled/initialize', auth, notificationController.initializeScheduledJobs);

// Start all scheduled jobs
router.post('/scheduled/start', auth, notificationController.startScheduledJobs);

// Stop all scheduled jobs
router.post('/scheduled/stop', auth, notificationController.stopScheduledJobs);

module.exports = router; 