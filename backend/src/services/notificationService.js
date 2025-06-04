const Notification = require('../models/Notification');

const notificationService = {
    /**
     * Create a notification
     * @param {Object} notificationData - Notification data
     * @param {Object} transaction - Optional database transaction
     * @returns {Object} - Created notification
     */
    createNotification: async (notificationData, transaction = null) => {
        try {
            const {
                type,
                title,
                message,
                orderId,
                metadata
            } = notificationData;

            // Create the notification
            const notification = await Notification.create({
                orderId: orderId,
                message: message,
                type: type === 'payment_cancelled' || type === 'supplementary_payment_cancelled' ? 'urgjent' : 'informacion',
                isRead: false
            }, { transaction });

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    /**
     * Get all notifications
     * @returns {Array} - Array of notifications
     */
    getAllNotifications: async () => {
        try {
            return await Notification.findAll({
                order: [['createdAt', 'DESC']]
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    /**
     * Get unread notifications
     * @returns {Array} - Array of unread notifications
     */
    getUnreadNotifications: async () => {
        try {
            return await Notification.findAll({
                where: { isRead: false },
                order: [['createdAt', 'DESC']]
            });
        } catch (error) {
            console.error('Error fetching unread notifications:', error);
            throw error;
        }
    },

    /**
     * Mark notification as read
     * @param {number} notificationId - Notification ID
     * @returns {Object} - Updated notification
     */
    markAsRead: async (notificationId) => {
        try {
            const notification = await Notification.findByPk(notificationId);
            if (!notification) {
                throw new Error('Notification not found');
            }

            await notification.update({ isRead: true });
            return notification;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    /**
     * Delete notification
     * @param {number} notificationId - Notification ID
     * @returns {boolean} - Success status
     */
    deleteNotification: async (notificationId) => {
        try {
            const notification = await Notification.findByPk(notificationId);
            if (!notification) {
                throw new Error('Notification not found');
            }

            await notification.destroy();
            return true;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }
};

module.exports = notificationService; 