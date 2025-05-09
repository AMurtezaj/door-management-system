const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');

const paymentController = {
    // Create new payment
    createPayment: async (req, res) => {
        try {
            const { orderId, shuma, menyraPageses, pershkrimi, numriTransaksionit } = req.body;

            const order = await Order.findByPk(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Porosia nuk u gjet!' });
            }

            const payment = await Payment.create({
                shuma,
                menyraPageses,
                pershkrimi,
                numriTransaksionit,
                eshteKonfirmuar: menyraPageses === 'kesh' // Cash payments are automatically confirmed
            });

            // Update order's remaining payment
            const newPagesaMbetur = order.pagesaMbetur - shuma;
            await order.update({
                pagesaMbetur: newPagesaMbetur,
                statusi: newPagesaMbetur <= 0 ? 'e përfunduar' : 'borxh'
            });

            res.status(201).json(payment);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get all payments
    getAllPayments: async (req, res) => {
        try {
            const payments = await Payment.findAll({
                order: [['createdAt', 'DESC']]
            });
            res.json(payments);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get payments by type
    getPaymentsByType: async (req, res) => {
        try {
            const payments = await Payment.findAll({
                where: { menyraPageses: req.params.menyraPageses },
                order: [['createdAt', 'DESC']]
            });
            res.json(payments);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Confirm bank payment
    confirmBankPayment: async (req, res) => {
        try {
            const payment = await Payment.findByPk(req.params.id);
            if (!payment) {
                return res.status(404).json({ message: 'Pagesa nuk u gjet!' });
            }

            if (payment.menyraPageses !== 'banke') {
                return res.status(400).json({ message: 'Kjo pagesë nuk është pagesë bankare!' });
            }

            await payment.update({
                eshteKonfirmuar: true,
                dataKonfirmimit: new Date()
            });

            res.json(payment);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get unconfirmed bank payments
    getUnconfirmedBankPayments: async (req, res) => {
        try {
            const payments = await Payment.findAll({
                where: {
                    menyraPageses: 'banke',
                    eshteKonfirmuar: false
                },
                order: [['createdAt', 'DESC']]
            });
            res.json(payments);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Delete payment (admin only)
    deletePayment: async (req, res) => {
        try {
            // Check if user is admin
            const user = await User.findByPk(req.user.id);
            if (!user || user.roli !== 'admin') {
                return res.status(403).json({ message: 'Nuk keni të drejta për të fshirë pagesat!' });
            }

            const payment = await Payment.findByPk(req.params.id);
            if (!payment) {
                return res.status(404).json({ message: 'Pagesa nuk u gjet!' });
            }

            // Update order's remaining payment
            const order = await Order.findByPk(payment.orderId);
            if (order) {
                const newPagesaMbetur = order.pagesaMbetur + payment.shuma;
                await order.update({
                    pagesaMbetur: newPagesaMbetur,
                    statusi: newPagesaMbetur > 0 ? 'borxh' : 'e përfunduar'
                });
            }

            await payment.destroy();
            res.json({ message: 'Pagesa u fshi me sukses!' });
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    }
};

module.exports = paymentController; 