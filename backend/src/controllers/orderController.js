const { Order, Customer, Payment, OrderDetails, SupplementaryOrder } = require('../models');
const DailyCapacity = require('../models/DailyCapacity');
const notificationController = require('./notificationController');
const orderService = require('../services/orderService');

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
                kaparaReceiver,
                sender,
                installer,
                    menyraPageses,
                    dita,
                    tipiPorosise,
                    pershkrimi,
                    isPaymentDone
                } = req.body;

                // Validate required fields
                const requiredFields = ['emriKlientit', 'mbiemriKlientit', 'numriTelefonit', 'vendi', 'shitesi', 'cmimiTotal', 'menyraPageses', 'tipiPorosise'];
                for (const field of requiredFields) {
                    if (!req.body[field]) {
                        return res.status(400).json({ message: `Fusha ${field} është e detyrueshme!` });
                    }
                }

                // Validate numeric fields
                if (isNaN(parseFloat(cmimiTotal))) {
                    return res.status(400).json({ message: 'CmimiTotal duhet të jetë një numër valid!' });
                }
                if (kaparja && isNaN(parseFloat(kaparja))) {
                    return res.status(400).json({ message: 'Kaparja duhet të jetë një numër valid!' });
                }

                // Format dita to DATEONLY (YYYY-MM-DD)
                const formattedDita = dita ? new Date(dita).toISOString().split('T')[0] : null;
                if (!formattedDita) {
                    return res.status(400).json({ message: 'Dita e realizimit është e detyrueshme!' });
                }

                // Check daily capacity
                const capacity = await DailyCapacity.findOne({ where: { dita: formattedDita } });
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

            // Prepare all order data with formatted date
            const orderData = {
                ...req.body,
                dita: formattedDita
            };

            // Use the service to create a complete order
            const order = await orderService.createCompleteOrder(orderData);

                // Create a notification for the order
                await notificationController.createOrderNotification(order.id);

                res.status(201).json(order);
            } catch (error) {
                console.error('Error creating order:', error);
                res.status(400).json({ message: 'Diçka shkoi keq!', error: error.message });
            }
        },

    // Get all orders
    getAllOrders: async (req, res) => {
        try {
            const orders = await Order.findAll({
                include: [
                    { model: Customer },
                    { model: Payment },
                    { model: OrderDetails, as: 'OrderDetail' },
                    { model: SupplementaryOrder }
                ],
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
                include: [
                    { model: Customer },
                    { model: Payment },
                    { model: OrderDetails, as: 'OrderDetail', where: { dita: req.params.dita } },
                    { model: SupplementaryOrder }
                ],
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
            const order = await Order.findByPk(req.params.id, {
                include: [
                    { model: Customer },
                    { model: Payment },
                    { model: OrderDetails, as: 'OrderDetail' },
                    { model: SupplementaryOrder }
                ]
            });
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
            const order = await orderService.updateCompleteOrder(req.params.id, req.body);
            
            // Create notification for the updated order
            await notificationController.createOrderNotification(order.id);
            
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

            const order = await orderService.updatePaymentStatus(id, isPaymentDone);
            
            // Create notification for the payment status change
            await notificationController.createOrderNotification(order.id);
            
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
                include: [
                    { model: Customer },
                    { model: Payment, where: { debtType: 'kesh', isPaymentDone: false } },
                    { model: OrderDetails, as: 'OrderDetail', where: { statusi: 'borxh' } },
                    { model: SupplementaryOrder }
                ],
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
                include: [
                    { model: Customer },
                    { model: Payment, where: { debtType: 'banke', isPaymentDone: false } },
                    { model: OrderDetails, as: 'OrderDetail', where: { statusi: 'borxh' } },
                    { model: SupplementaryOrder }
                ],
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
            // Count cash debts from main orders
            const cashDebtCount = await Payment.count({
                where: {
                    debtType: 'kesh',
                    isPaymentDone: false
                }
            });

            // Count bank debts from main orders
            const bankDebtCount = await Payment.count({
                where: {
                    debtType: 'banke',
                    isPaymentDone: false
                }
            });

            // Count cash debts from supplementary orders
            const suppCashDebtCount = await SupplementaryOrder.count({
                where: {
                    menyraPageses: 'kesh',
                    isPaymentDone: false
                }
            });

            // Count bank debts from supplementary orders
            const suppBankDebtCount = await SupplementaryOrder.count({
                where: {
                    menyraPageses: 'banke',
                    isPaymentDone: false
                }
            });

            // Sum cash debt amounts from main orders
            const payments = await Payment.findAll({
                where: {
                    debtType: 'kesh',
                    isPaymentDone: false
                },
                attributes: ['cmimiTotal', 'kaparja']
            });

            // Calculate total cash debt from main orders
            const totalCashDebt = payments.reduce((total, payment) => {
                return total + (parseFloat(payment.cmimiTotal) - parseFloat(payment.kaparja));
            }, 0);

            // Sum bank debt amounts from main orders
            const bankPayments = await Payment.findAll({
                where: {
                    debtType: 'banke',
                    isPaymentDone: false
                },
                attributes: ['cmimiTotal', 'kaparja']
            });

            // Calculate total bank debt from main orders
            const totalBankDebt = bankPayments.reduce((total, payment) => {
                return total + (parseFloat(payment.cmimiTotal) - parseFloat(payment.kaparja));
            }, 0);

            // Sum cash debt amounts from supplementary orders
            const suppCashDebts = await SupplementaryOrder.findAll({
                where: {
                    menyraPageses: 'kesh',
                    isPaymentDone: false
                },
                attributes: ['pagesaMbetur']
            });

            const totalSuppCashDebt = suppCashDebts.reduce((total, suppOrder) => {
                return total + parseFloat(suppOrder.pagesaMbetur || 0);
            }, 0);

            // Sum bank debt amounts from supplementary orders
            const suppBankDebts = await SupplementaryOrder.findAll({
                where: {
                    menyraPageses: 'banke',
                    isPaymentDone: false
                },
                attributes: ['pagesaMbetur']
            });

            const totalSuppBankDebt = suppBankDebts.reduce((total, suppOrder) => {
                return total + parseFloat(suppOrder.pagesaMbetur || 0);
            }, 0);

            const statistics = {
                // Main order debts
                cashDebtCount,
                bankDebtCount,
                totalCashDebt,
                totalBankDebt,
                
                // Supplementary order debts
                suppCashDebtCount,
                suppBankDebtCount,
                totalSuppCashDebt,
                totalSuppBankDebt,
                
                // Combined totals
                totalDebtCount: cashDebtCount + bankDebtCount + suppCashDebtCount + suppBankDebtCount,
                totalCombinedCashDebt: totalCashDebt + totalSuppCashDebt,
                totalCombinedBankDebt: totalBankDebt + totalSuppBankDebt,
                totalDebt: totalCashDebt + totalBankDebt + totalSuppCashDebt + totalSuppBankDebt
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

            const orderDetails = await OrderDetails.findOne({ where: { orderId: id } });
            if (!orderDetails) {
                return res.status(404).json({ message: 'Porosia nuk u gjet!' });
            }

            await orderDetails.update({
                statusiMatjes,
                matesi: matesi || orderDetails.matesi,
                dataMatjes: dataMatjes || new Date()
            });

            const order = await Order.findByPk(id, {
                include: [
                    { model: Customer },
                    { model: Payment },
                    { model: OrderDetails, as: 'OrderDetail' },
                    { model: SupplementaryOrder }
                ]
            });

            res.json(order);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Update door dimensions
    updateDimensions: async (req, res) => {
        try {
            const { id } = req.params;
            const { gjatesia, gjeresia, profiliLarte, profiliPoshtem } = req.body;

            const orderDetails = await OrderDetails.findOne({ where: { orderId: id } });
            if (!orderDetails) {
                return res.status(404).json({ message: 'Porosia nuk u gjet!' });
            }

            // Validate numeric values
            const validateNumber = (value, fieldName) => {
                if (value !== undefined && value !== null && value !== '') {
                    const num = parseFloat(value);
                    if (isNaN(num) || num < 0) {
                        throw new Error(`${fieldName} duhet të jetë një numër pozitiv!`);
                    }
                    return num;
                }
                return undefined;
            };

            const validatedData = {};
            if (gjatesia !== undefined) validatedData.gjatesia = validateNumber(gjatesia, 'Gjatësia');
            if (gjeresia !== undefined) validatedData.gjeresia = validateNumber(gjeresia, 'Gjerësia');
            if (profiliLarte !== undefined) validatedData.profiliLarte = validateNumber(profiliLarte, 'Profili i lartë');
            if (profiliPoshtem !== undefined) validatedData.profiliPoshtem = validateNumber(profiliPoshtem, 'Profili i poshtëm');

            await orderDetails.update(validatedData);

            // Reload to get the updated data with virtual fields
            const updatedOrderDetails = await OrderDetails.findOne({ where: { orderId: id } });
            const calculations = updatedOrderDetails.getDimensionCalculations();

            const order = await Order.findByPk(id, {
                include: [
                    { model: Customer },
                    { model: Payment },
                    { model: OrderDetails, as: 'OrderDetail' },
                    { model: SupplementaryOrder }
                ]
            });

            res.json({
                order,
                dimensionCalculations: calculations
            });
        } catch (error) {
            console.error('Error updating dimensions:', error);
            res.status(400).json({ message: error.message || 'Diçka shkoi keq gjatë përditësimit të dimensioneve!' });
        }
    },

    // Get dimension calculations for an order
    getDimensionCalculations: async (req, res) => {
        try {
            const { id } = req.params;

            const orderDetails = await OrderDetails.findOne({ where: { orderId: id } });
            if (!orderDetails) {
                return res.status(404).json({ message: 'Porosia nuk u gjet!' });
            }

            const calculations = orderDetails.getDimensionCalculations();
            res.json(calculations);
        } catch (error) {
            console.error('Error getting dimension calculations:', error);
            res.status(400).json({ message: 'Diçka shkoi keq gjatë llogaritjes së dimensioneve!' });
        }
    },
    
    // Update print status
    updatePrintStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { eshtePrintuar } = req.body;

            const orderDetails = await OrderDetails.findOne({ where: { orderId: id } });
            if (!orderDetails) {
                return res.status(404).json({ message: 'Porosia nuk u gjet!' });
            }

            await orderDetails.update({
                eshtePrintuar: eshtePrintuar !== undefined ? eshtePrintuar : true,
                updatedAt: new Date()
            });

            const order = await Order.findByPk(id, {
                include: [
                    { model: Customer },
                    { model: Payment },
                    { model: OrderDetails, as: 'OrderDetail' },
                    { model: SupplementaryOrder }
                ]
            });

            res.json(order);
        } catch (error) {
            console.error('Error updating print status:', error);
            res.status(400).json({ message: 'Diçka shkoi keq gjatë përditësimit të statusit të printimit!' });
        }
    },

    // Get orders by measurement status
    getOrdersByMeasurementStatus: async (req, res) => {
        try {
            const { statusiMatjes } = req.params;
            const orders = await Order.findAll({
                include: [
                    { model: Customer },
                    { model: Payment },
                    { model: OrderDetails, as: 'OrderDetail', where: { statusiMatjes } },
                    { model: SupplementaryOrder }
                ],
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

            await order.destroy(); // This will cascade delete related records due to our relationship settings
            res.json({ message: 'Porosia u fshi me sukses!' });
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get supplementary order cash debts
    getSupplementaryCashDebtOrders: async (req, res) => {
        try {
            const supplementaryOrders = await SupplementaryOrder.findAll({
                where: {
                    menyraPageses: 'kesh',
                    isPaymentDone: false
                },
                include: [
                    {
                        model: Order,
                        as: 'ParentOrder',
                        include: [{ model: Customer }]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            res.json(supplementaryOrders);
        } catch (error) {
            console.error('Error fetching supplementary cash debt orders:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get supplementary order bank debts
    getSupplementaryBankDebtOrders: async (req, res) => {
        try {
            const supplementaryOrders = await SupplementaryOrder.findAll({
                where: {
                    menyraPageses: 'banke',
                    isPaymentDone: false
                },
                include: [
                    {
                        model: Order,
                        as: 'ParentOrder',
                        include: [{ model: Customer }]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            res.json(supplementaryOrders);
        } catch (error) {
            console.error('Error fetching supplementary bank debt orders:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    }
};

module.exports = orderController; 