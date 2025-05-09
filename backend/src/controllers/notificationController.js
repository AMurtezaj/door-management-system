const Notification = require('../models/Notification');
const Order = require('../models/Order');

const notificationController = {
    // Get all notifications
    getAllNotifications: async (req, res) => {
        try {
            const notifications = await Notification.findAll({
                include: [{
                    model: Order,
                    attributes: ['emriKlientit', 'mbiemriKlientit', 'statusi', 'dita']
                }],
                order: [['createdAt', 'DESC']]
            });
            res.json(notifications);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get unread notifications
    getUnreadNotifications: async (req, res) => {
        try {
            const notifications = await Notification.findAll({
                where: { isRead: false },
                include: [{
                    model: Order,
                    attributes: ['emriKlientit', 'mbiemriKlientit', 'statusi', 'dita']
                }],
                order: [['createdAt', 'DESC']]
            });
            res.json(notifications);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Mark notification as read
    markAsRead: async (req, res) => {
        try {
            const notification = await Notification.findByPk(req.params.id);
            if (!notification) {
                return res.status(404).json({ message: 'Njoftimi nuk u gjet!' });
            }

            await notification.update({ isRead: true });
            res.json(notification);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Mark all notifications as read
    markAllAsRead: async (req, res) => {
        try {
            await Notification.update(
                { isRead: true },
                { where: { isRead: false } }
            );
            res.json({ message: 'Të gjitha njoftimet u shënuan si të lexuara!' });
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Create notification for orders
    createOrderNotification: async (orderId) => {
        try {
            const order = await Order.findByPk(orderId);
            if (!order) return;

            // Check if order is finished but has remaining payment (borxh)
            if (order.statusi === 'borxh' && order.pagesaMbetur > 0) {
                await Notification.create({
                    orderId,
                    message: `Porosia për ${order.emriKlientit} ${order.mbiemriKlientit} ka borxh prej ${order.pagesaMbetur}€!`,
                    type: 'urgjent'
                });
            }
            // Check if order is not finished
            else if (order.statusi === 'në proces') {
                await Notification.create({
                    orderId,
                    message: `Porosia për ${order.emriKlientit} ${order.mbiemriKlientit} nuk është përfunduar!`,
                    type: 'paralajmërim'
                });
            }
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }
};

module.exports = notificationController; 