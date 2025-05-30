const Notification = require('../models/Notification');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const OrderDetails = require('../models/OrderDetails');

const notificationController = {
    // Get all notifications
    getAllNotifications: async (req, res) => {
        try {
            const notifications = await Notification.findAll({
                order: [['createdAt', 'DESC']]
            });
            res.json(notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get unread notifications
    getUnreadNotifications: async (req, res) => {
        try {
            const notifications = await Notification.findAll({
                where: { isRead: false },
                order: [['createdAt', 'DESC']]
            });
            res.json(notifications);
        } catch (error) {
            console.error('Error fetching unread notifications:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get unread notifications count
    getUnreadCount: async (req, res) => {
        try {
            const count = await Notification.count({
                where: { isRead: false }
            });
            res.json({ count });
        } catch (error) {
            console.error('Error fetching unread count:', error);
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
            console.error('Error marking notification as read:', error);
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
            console.error('Error marking all notifications as read:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Delete notification
    deleteNotification: async (req, res) => {
        try {
            const notification = await Notification.findByPk(req.params.id);
            if (!notification) {
                return res.status(404).json({ message: 'Njoftimi nuk u gjet!' });
            }

            await notification.destroy();
            res.json({ message: 'Njoftimi u fshi me sukses!' });
        } catch (error) {
            console.error('Error deleting notification:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Create notification for orders
    createOrderNotification: async (orderId) => {
        try {
            const order = await Order.findByPk(orderId, {
                include: [
                    { model: Customer },
                    { model: Payment },
                    { model: OrderDetails, as: 'OrderDetail' }
                ]
            });
            
            if (!order) return;

            const orderDetail = order.OrderDetail;
            const payment = order.Payment;
            const customer = order.Customer;

            if (!orderDetail || !payment || !customer) return;

            // Check if order has debt (remaining payment)
            const remainingPayment = parseFloat(payment.cmimiTotal) - parseFloat(payment.kaparja);
            
            if (remainingPayment > 0 && !payment.isPaymentDone) {
                await Notification.create({
                    orderId,
                    message: `Porosia për ${customer.emri} ${customer.mbiemri} ka borxh prej ${remainingPayment.toFixed(2)}€!`,
                    type: 'urgjent'
                });
            }
            // Check if order is not finished
            else if (orderDetail.statusi === 'në proces') {
                await Notification.create({
                    orderId,
                    message: `Porosia për ${customer.emri} ${customer.mbiemri} nuk është përfunduar!`,
                    type: 'paralajmërim'
                });
            }
            // Create info notification for completed orders
            else if (orderDetail.statusi === 'përfunduar' && payment.isPaymentDone) {
                await Notification.create({
                    orderId,
                    message: `Porosia për ${customer.emri} ${customer.mbiemri} është përfunduar me sukses!`,
                    type: 'informacion'
                });
            }
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }
};

module.exports = notificationController; 