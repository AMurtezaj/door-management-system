const Notification = require('../models/Notification');
const cron = require('node-cron');
const { Op } = require('sequelize');
const { Order, Customer, Payment, OrderDetails } = require('../models');

const notificationService = {
    // Scheduled jobs management
    scheduledJobs: [],
    isScheduledInitialized: false,

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
                type: type === 'payment_cancelled' || type === 'supplementary_payment_cancelled' || type === 'urgjent' ? 'urgjent' : type || 'informacion',
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
    },

    // ====== SCHEDULED NOTIFICATION FUNCTIONALITY ======

    /**
     * Initialize scheduled notification jobs
     */
    initializeScheduledJobs: function() {
        if (this.isScheduledInitialized) {
            console.log('Scheduled notification jobs already initialized');
            return;
        }

        try {
            // Daily overdue order check at 12:15 AM
            this.scheduleOverdueOrderChecks();
            
            // Monthly debt report on the last day of each month at 11:00 PM
            this.scheduleMonthlyDebtReports();
            
            // Weekly reminder for long-pending orders (bonus feature)
            this.scheduleWeeklyReminders();

            this.isScheduledInitialized = true;
            console.log('✅ Scheduled notification jobs initialized successfully');
            console.log(`📅 Active jobs: ${this.scheduledJobs.length}`);
        } catch (error) {
            console.error('❌ Error initializing scheduled notification jobs:', error);
        }
    },

    /**
     * Schedule daily overdue order checks
     * Runs at 12:15 AM every day
     */
    scheduleOverdueOrderChecks: function() {
        const job = cron.schedule('15 0 * * *', async () => {
            console.log('🔍 Running daily overdue order check...');
            await this.checkOverdueOrders();
        }, {
            scheduled: true,
            timezone: "Europe/Rome"
        });

        this.scheduledJobs.push({
            name: 'Daily Overdue Orders Check',
            schedule: '15 0 * * *',
            job: job
        });

        console.log('✅ Scheduled daily overdue order checks (12:15 AM)');
    },

    /**
     * Schedule monthly debt reports
     * Runs on the last day of each month at 11:00 PM
     */
    scheduleMonthlyDebtReports: function() {
        const job = cron.schedule('0 23 28-31 * *', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Only run if tomorrow is the first day of next month
            if (tomorrow.getDate() === 1) {
                console.log('📊 Running monthly debt report...');
                await this.generateMonthlyDebtReport();
            }
        }, {
            scheduled: true,
            timezone: "Europe/Rome"
        });

        this.scheduledJobs.push({
            name: 'Monthly Debt Report',
            schedule: '0 23 28-31 * *',
            job: job
        });

        console.log('✅ Scheduled monthly debt reports (last day of month at 11:00 PM)');
    },

    /**
     * Schedule weekly reminders for long-pending orders
     * Runs every Monday at 9:00 AM
     */
    scheduleWeeklyReminders: function() {
        const job = cron.schedule('0 9 * * 1', async () => {
            console.log('📋 Running weekly long-pending orders check...');
            await this.checkLongPendingOrders();
        }, {
            scheduled: true,
            timezone: "Europe/Rome"
        });

        this.scheduledJobs.push({
            name: 'Weekly Long-Pending Orders',
            schedule: '0 9 * * 1',
            job: job
        });

        console.log('✅ Scheduled weekly long-pending order reminders (Mondays at 9:00 AM)');
    },

    /**
     * Check for overdue orders and create notifications
     */
    checkOverdueOrders: async function() {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(23, 59, 59, 999);
            
            console.log(`🔍 Checking for orders scheduled before: ${yesterday.toISOString()}`);

            const overdueOrders = await Order.findAll({
                include: [
                    {
                        model: Customer,
                        required: true
                    },
                    {
                        model: Payment,
                        required: true
                    },
                    {
                        model: OrderDetails,
                        as: 'OrderDetail',
                        required: true,
                        where: {
                            dita: {
                                [Op.lte]: yesterday
                            },
                            statusi: {
                                [Op.not]: 'përfunduar'
                            }
                        }
                    }
                ]
            });

            console.log(`📋 Found ${overdueOrders.length} overdue orders`);

            for (const order of overdueOrders) {
                await this.createOverdueOrderNotification(order);
            }

            if (overdueOrders.length > 0) {
                await this.createOverdueSummaryNotification(overdueOrders.length);
            }

            console.log(`✅ Processed ${overdueOrders.length} overdue order notifications`);
        } catch (error) {
            console.error('❌ Error checking overdue orders:', error);
        }
    },

    /**
     * Generate monthly debt report
     */
    generateMonthlyDebtReport: async function() {
        try {
            console.log('📊 Generating monthly debt report...');

            const debtOrders = await Order.findAll({
                include: [
                    {
                        model: Customer,
                        required: true
                    },
                    {
                        model: Payment,
                        required: true,
                        where: {
                            isPaymentDone: false,
                            cmimiTotal: {
                                [Op.gt]: 0
                            }
                        }
                    },
                    {
                        model: OrderDetails,
                        as: 'OrderDetail',
                        required: true
                    }
                ]
            });

            let totalDebt = 0;
            const debtSummary = {
                cash: { count: 0, amount: 0 },
                bank: { count: 0, amount: 0 }
            };

            for (const order of debtOrders) {
                const remainingDebt = parseFloat(order.Payment.cmimiTotal) - parseFloat(order.Payment.kaparja || 0);
                totalDebt += remainingDebt;

                if (order.Payment.menyraPageses === 'kesh') {
                    debtSummary.cash.count++;
                    debtSummary.cash.amount += remainingDebt;
                } else {
                    debtSummary.bank.count++;
                    debtSummary.bank.amount += remainingDebt;
                }
            }

            console.log(`📊 Monthly debt summary:`, {
                totalOrders: debtOrders.length,
                totalDebt: totalDebt.toFixed(2),
                cashDebt: debtSummary.cash.amount.toFixed(2),
                bankDebt: debtSummary.bank.amount.toFixed(2)
            });

            await this.createMonthlyDebtReportNotification(debtOrders, totalDebt, debtSummary);
            console.log('✅ Monthly debt report generated successfully');
        } catch (error) {
            console.error('❌ Error generating monthly debt report:', error);
        }
    },

    /**
     * Check for orders that have been pending for more than a week
     */
    checkLongPendingOrders: async function() {
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const longPendingOrders = await Order.findAll({
                include: [
                    {
                        model: Customer,
                        required: true
                    },
                    {
                        model: OrderDetails,
                        as: 'OrderDetail',
                        required: true,
                        where: {
                            statusi: {
                                [Op.in]: ['në proces', 'e re']
                            },
                            createdAt: {
                                [Op.lte]: oneWeekAgo
                            }
                        }
                    }
                ]
            });

            console.log(`📋 Found ${longPendingOrders.length} long-pending orders`);

            if (longPendingOrders.length > 0) {
                await this.createLongPendingOrdersNotification(longPendingOrders);
            }
        } catch (error) {
            console.error('❌ Error checking long-pending orders:', error);
        }
    },

    /**
     * Create notification for overdue order
     */
    createOverdueOrderNotification: async function(order) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const existingNotification = await Notification.findOne({
                where: {
                    orderId: order.id,
                    message: {
                        [Op.like]: '%nuk është përfunduar në kohë%'
                    },
                    createdAt: {
                        [Op.gte]: today
                    }
                }
            });

            if (existingNotification) {
                console.log(`⏭️  Notification already exists for order ${order.id}`);
                return;
            }

            const deliveryDate = new Date(order.OrderDetail.dita);
            const formattedDate = deliveryDate.toLocaleDateString('sq-AL');

            const message = `⚠️ VONESA: Porosia për ${order.Customer.emri} ${order.Customer.mbiemri} e planifikuar për ${formattedDate} nuk është përfunduar në kohë. Statusi: ${order.OrderDetail.statusi}`;

            await this.createNotification({
                orderId: order.id,
                message: message,
                type: 'urgjent'
            });

            console.log(`📧 Created overdue notification for order ${order.id}`);
        } catch (error) {
            console.error(`❌ Error creating overdue notification for order ${order.id}:`, error);
        }
    },

    /**
     * Create summary notification for overdue orders
     */
    createOverdueSummaryNotification: async function(count) {
        try {
            const message = `📊 PËRMBLEDHJE VONESA: Ka ${count} porosi të vonuara që duhen kontrolluar dhe përditësuar.`;

            await this.createNotification({
                message: message,
                type: 'urgjent'
            });

            console.log(`📧 Created overdue summary notification (${count} orders)`);
        } catch (error) {
            console.error('❌ Error creating overdue summary notification:', error);
        }
    },

    /**
     * Create monthly debt report notification
     */
    createMonthlyDebtReportNotification: async function(debtOrders, totalDebt, debtSummary) {
        try {
            const currentMonth = new Date().toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' });
            
            const message = `📊 RAPORTI MUJOR I BORXHEVE - ${currentMonth}: ` +
                `${debtOrders.length} porosi me borxh total ${totalDebt.toFixed(2)}€. ` +
                `Kesh: ${debtSummary.cash.count} porosi (${debtSummary.cash.amount.toFixed(2)}€), ` +
                `Bankë: ${debtSummary.bank.count} porosi (${debtSummary.bank.amount.toFixed(2)}€)`;

            await this.createNotification({
                message: message,
                type: 'informacion'
            });

            console.log(`📧 Created monthly debt report notification`);
        } catch (error) {
            console.error('❌ Error creating monthly debt report notification:', error);
        }
    },

    /**
     * Create notification for long-pending orders
     */
    createLongPendingOrdersNotification: async function(orders) {
        try {
            const message = `📋 POROSI TË VONUARA: ${orders.length} porosi kanë qenë në proces për më shumë se 1 javë dhe duhen kontrolluar.`;

            await this.createNotification({
                message: message,
                type: 'paralajmërim'
            });

            console.log(`📧 Created long-pending orders notification (${orders.length} orders)`);
        } catch (error) {
            console.error('❌ Error creating long-pending orders notification:', error);
        }
    },

    /**
     * Manually trigger overdue check (for testing)
     */
    triggerOverdueCheck: async function() {
        console.log('🔍 Manually triggering overdue check...');
        await this.checkOverdueOrders();
    },

    /**
     * Manually trigger debt report (for testing)
     */
    triggerDebtReport: async function() {
        console.log('📊 Manually triggering debt report...');
        await this.generateMonthlyDebtReport();
    },

    /**
     * Get scheduled jobs status
     */
    getScheduledJobsStatus: function() {
        return {
            initialized: this.isScheduledInitialized,
            jobs: this.scheduledJobs.map(job => ({
                name: job.name,
                schedule: job.schedule,
                running: job.job.running
            }))
        };
    },

    /**
     * Stop all scheduled jobs
     */
    stopScheduledJobs: function() {
        this.scheduledJobs.forEach(job => {
            job.job.stop();
        });
        console.log('🛑 All scheduled notification jobs stopped');
    },

    /**
     * Start all scheduled jobs
     */
    startScheduledJobs: function() {
        this.scheduledJobs.forEach(job => {
            job.job.start();
        });
        console.log('▶️  All scheduled notification jobs started');
    }
};

module.exports = notificationService; 