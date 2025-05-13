const Order = require('../models/Order');
const DailyCapacity = require('../models/DailyCapacity');
const notificationController = require('./notificationController');

const orderController = {
    // Create new order
    createOrder: async (req, res) => {
        try {
            const {
                emriKlientit,
                mbiemriKlientit,
                numriTelefonit,
                vendi,
                shitesi,
                matesi,
                dataMatjes,
                cmimiTotal,
                kaparja,
                menyraPageses,
                dita,
                tipiPorosise,
                pershkrimi,
                isPaymentDone
            } = req.body;

            if (!dita) {
                return res.status(400).json({ message: 'Dita e realizimit është e detyrueshme!' });
            }

            // Check daily capacity
            const capacity = await DailyCapacity.findOne({ where: { dita } });
            if (!capacity) {
                return res.status(400).json({ message: 'Kapaciteti për këtë ditë nuk është caktuar!' });
            }

            if (tipiPorosise === 'derë garazhi' && capacity.dyerGarazhi <= 0) {
                return res.status(400).json({ message: 'Nuk ka kapacitet për dyer garazhi për këtë ditë!' });
            }

            if (tipiPorosise === 'kapak' && capacity.kapake <= 0) {
                return res.status(400).json({ message: 'Nuk ka kapacitet për kapakë për këtë ditë!' });
            }

            // Update capacity
            if (tipiPorosise === 'derë garazhi') {
                await capacity.update({ dyerGarazhi: capacity.dyerGarazhi - 1 });
            } else if (tipiPorosise === 'kapak') {
                await capacity.update({ kapake: capacity.kapake - 1 });
            }

            // Calculate the remaining payment amount (done by the virtual field)
            const pagesaMbeturCalculated = parseFloat(cmimiTotal) - parseFloat(kaparja || 0);
            
            // Determine debt type and status based on payment status
            const isPaid = isPaymentDone === true;
            let statusi = 'në proces';
            let debtType = 'none';
            
            if (!isPaid && pagesaMbeturCalculated > 0) {
                statusi = 'borxh';
                debtType = menyraPageses; // 'kesh' or 'banke'
            } else if (isPaid || pagesaMbeturCalculated <= 0) {
                statusi = 'e përfunduar';
                debtType = 'none';
            }

            const order = await Order.create({
                emriKlientit,
                mbiemriKlientit,
                numriTelefonit,
                vendi,
                shitesi,
                matesi,
                dataMatjes,
                cmimiTotal,
                kaparja: kaparja || 0,
                menyraPageses,
                isPaymentDone: isPaid,
                debtType,
                dita,
                tipiPorosise,
                pershkrimi,
                statusi,
                statusiMatjes: 'e pamatur'
            });

            res.status(201).json(order);
        } catch (error) {
            console.error('Error creating order:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get all orders
    getAllOrders: async (req, res) => {
        try {
            const orders = await Order.findAll({
                order: [['createdAt', 'DESC']]
            });
            res.json(orders);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get orders by day
    getOrdersByDay: async (req, res) => {
        try {
            const orders = await Order.findAll({
                where: { dita: req.params.dita },
                order: [['createdAt', 'DESC']]
            });
            res.json(orders);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get order by ID
    getOrderById: async (req, res) => {
        try {
            const order = await Order.findByPk(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Porosia nuk u gjet!' });
            }
            res.json(order);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Update order
    updateOrder: async (req, res) => {
        try {
            const order = await Order.findByPk(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Porosia nuk u gjet!' });
            }

            // Extract the relevant fields
            const {
                cmimiTotal,
                kaparja,
                isPaymentDone,
                menyraPageses
            } = req.body;

            const updateData = { ...req.body };

            // Calculate the remaining payment (this is handled by the virtual field in the model)
            const newCmimiTotal = cmimiTotal !== undefined ? parseFloat(cmimiTotal) : parseFloat(order.cmimiTotal);
            const newKaparja = kaparja !== undefined ? parseFloat(kaparja) : parseFloat(order.kaparja);
            const pagesaMbeturCalculated = newCmimiTotal - newKaparja;
            
            // Determine status and debt type based on payment status
            const isPaid = isPaymentDone !== undefined ? isPaymentDone : order.isPaymentDone;
            const currentMenyraPageses = menyraPageses || order.menyraPageses;
            
            if (!isPaid && pagesaMbeturCalculated > 0) {
                updateData.statusi = 'borxh';
                updateData.debtType = currentMenyraPageses;
            } else if (isPaid || pagesaMbeturCalculated <= 0) {
                updateData.statusi = 'e përfunduar';
                updateData.debtType = 'none';
            }

            await order.update(updateData);
            res.json(order);
        } catch (error) {
            console.error('Error updating order:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Update payment status
    updatePaymentStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { isPaymentDone } = req.body;

            const order = await Order.findByPk(id);
            if (!order) {
                return res.status(404).json({ message: 'Porosia nuk u gjet!' });
            }

            // Calculate the remaining payment
            const pagesaMbeturCalculated = parseFloat(order.cmimiTotal) - parseFloat(order.kaparja);
            
            // Update payment status and related fields
            const updateData = {
                isPaymentDone
            };
            
            if (isPaymentDone) {
                updateData.statusi = 'e përfunduar';
                updateData.debtType = 'none';
            } else if (pagesaMbeturCalculated > 0) {
                updateData.statusi = 'borxh';
                updateData.debtType = order.menyraPageses;
            }

            await order.update(updateData);
            res.json(order);
        } catch (error) {
            console.error('Error updating payment status:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get cash debt orders
    getCashDebtOrders: async (req, res) => {
        try {
            const orders = await Order.findAll({
                where: {
                    debtType: 'kesh',
                    isPaymentDone: false,
                    statusi: 'borxh'
                },
                order: [['createdAt', 'DESC']]
            });
            res.json(orders);
        } catch (error) {
            console.error('Error fetching cash debt orders:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get bank debt orders
    getBankDebtOrders: async (req, res) => {
        try {
            const orders = await Order.findAll({
                where: {
                    debtType: 'banke',
                    isPaymentDone: false,
                    statusi: 'borxh'
                },
                order: [['createdAt', 'DESC']]
            });
            res.json(orders);
        } catch (error) {
            console.error('Error fetching bank debt orders:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get debt statistics
    getDebtStatistics: async (req, res) => {
        try {
            // Count cash debts
            const cashDebtCount = await Order.count({
                where: {
                    debtType: 'kesh',
                    isPaymentDone: false,
                    statusi: 'borxh'
                }
            });

            // Count bank debts
            const bankDebtCount = await Order.count({
                where: {
                    debtType: 'banke',
                    isPaymentDone: false,
                    statusi: 'borxh'
                }
            });

            // Sum cash debt amounts
            const orders = await Order.findAll({
                where: {
                    debtType: 'kesh',
                    isPaymentDone: false,
                    statusi: 'borxh'
                },
                attributes: ['cmimiTotal', 'kaparja']
            });

            // Calculate total cash debt
            const totalCashDebt = orders.reduce((total, order) => {
                return total + (parseFloat(order.cmimiTotal) - parseFloat(order.kaparja));
            }, 0);

            // Sum bank debt amounts
            const bankOrders = await Order.findAll({
                where: {
                    debtType: 'banke',
                    isPaymentDone: false,
                    statusi: 'borxh'
                },
                attributes: ['cmimiTotal', 'kaparja']
            });

            // Calculate total bank debt
            const totalBankDebt = bankOrders.reduce((total, order) => {
                return total + (parseFloat(order.cmimiTotal) - parseFloat(order.kaparja));
            }, 0);

            const statistics = {
                cashDebtCount,
                bankDebtCount,
                totalDebtCount: cashDebtCount + bankDebtCount,
                totalCashDebt,
                totalBankDebt,
                totalDebt: totalCashDebt + totalBankDebt
            };

            res.json(statistics);
        } catch (error) {
            console.error('Error getting debt statistics:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Update measurement status
    updateMeasurementStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { statusiMatjes, matesi, dataMatjes } = req.body;

            const order = await Order.findByPk(id);
            if (!order) {
                return res.status(404).json({ message: 'Porosia nuk u gjet!' });
            }

            await order.update({
                statusiMatjes,
                matesi: matesi || order.matesi,
                dataMatjes: dataMatjes || new Date()
            });

            res.json(order);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get orders by measurement status
    getOrdersByMeasurementStatus: async (req, res) => {
        try {
            const { statusiMatjes } = req.params;
            const orders = await Order.findAll({
                where: { statusiMatjes },
                order: [['createdAt', 'DESC']]
            });
            res.json(orders);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Delete order
    deleteOrder: async (req, res) => {
        try {
            const order = await Order.findByPk(req.params.id);
            if (!order) {
                return res.status(404).json({ message: 'Porosia nuk u gjet!' });
            }

            await order.destroy();
            res.json({ message: 'Porosia u fshi me sukses!' });
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    }
};

module.exports = orderController; 