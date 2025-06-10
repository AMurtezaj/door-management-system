const Notification = require('../models/Notification');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const OrderDetails = require('../models/OrderDetails');
const notificationService = require('../services/notificationService');

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
    },

    // ====== SCHEDULED NOTIFICATION ENDPOINTS ======

    // Get status of scheduled notification jobs
    getScheduledJobsStatus: async (req, res) => {
        try {
            const status = notificationService.getScheduledJobsStatus();
            res.json(status);
        } catch (error) {
            console.error('Error getting scheduled jobs status:', error);
            res.status(500).json({ message: 'Gabim gjatë marrjes së statusit të punëve të planifikuara' });
        }
    },

    // Manually trigger overdue orders check
    triggerOverdueCheck: async (req, res) => {
        try {
            await notificationService.triggerOverdueCheck();
            res.json({ 
                success: true, 
                message: 'Kontrolli i porosive të vonuara u aktivizua me sukses' 
            });
        } catch (error) {
            console.error('Error triggering overdue check:', error);
            res.status(500).json({ message: 'Gabim gjatë aktivizimit të kontrollit të porosive të vonuara' });
        }
    },

    // Manually trigger monthly debt report
    triggerDebtReport: async (req, res) => {
        try {
            await notificationService.triggerDebtReport();
            res.json({ 
                success: true, 
                message: 'Raporti mujor i borxheve u gjenerua me sukses' 
            });
        } catch (error) {
            console.error('Error triggering debt report:', error);
            res.status(500).json({ message: 'Gabim gjatë gjenerimit të raportit mujor të borxheve' });
        }
    },

    // Initialize scheduled notification jobs
    initializeScheduledJobs: async (req, res) => {
        try {
            notificationService.initializeScheduledJobs();
            res.json({ 
                success: true, 
                message: 'Sistemi i njoftimeve të planifikuara u inicializua me sukses' 
            });
        } catch (error) {
            console.error('Error initializing scheduled jobs:', error);
            res.status(500).json({ message: 'Gabim gjatë inicializimit të sistemit të njoftimeve' });
        }
    },

    // Start all scheduled jobs
    startScheduledJobs: async (req, res) => {
        try {
            notificationService.startScheduledJobs();
            res.json({ 
                success: true, 
                message: 'Të gjitha punet e planifikuara u nisën me sukses' 
            });
        } catch (error) {
            console.error('Error starting scheduled jobs:', error);
            res.status(500).json({ message: 'Gabim gjatë nisjes së punëve të planifikuara' });
        }
    },

    // Stop all scheduled jobs
    stopScheduledJobs: async (req, res) => {
        try {
            notificationService.stopScheduledJobs();
            res.json({ 
                success: true, 
                message: 'Të gjitha punet e planifikuara u ndalën me sukses' 
            });
        } catch (error) {
            console.error('Error stopping scheduled jobs:', error);
            res.status(500).json({ message: 'Gabim gjatë ndaljes së punëve të planifikuara' });
        }
    }
};

module.exports = notificationController; 