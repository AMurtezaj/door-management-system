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
                pagesaMbetur,
                kaparja,
                menyraPageses,
                dita,
                tipiPorosise,
                pershkrimi
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

            const order = await Order.create({
                emriKlientit,
                mbiemriKlientit,
                numriTelefonit,
                vendi,
                shitesi,
                matesi,
                dataMatjes,
                cmimiTotal,
                pagesaMbetur,
                kaparja,
                menyraPageses,
                dita,
                tipiPorosise,
                pershkrimi,
                statusi: 'në proces',
                statusiMatjes: 'e pamatur'
            });

            res.status(201).json(order);
        } catch (error) {
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

            await order.update(req.body);
            res.json(order);
        } catch (error) {
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