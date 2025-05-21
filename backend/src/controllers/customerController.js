const { Customer, Order } = require('../models');
const { Op } = require('sequelize');

const customerController = {
    // Get all customers
    getAllCustomers: async (req, res) => {
        try {
            const customers = await Customer.findAll({
                order: [['createdAt', 'DESC']]
            });
            res.json(customers);
        } catch (error) {
            console.error('Error fetching customers:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get customer by ID
    getCustomerById: async (req, res) => {
        try {
            const customer = await Customer.findByPk(req.params.id, {
                include: [{ model: Order }]
            });
            if (!customer) {
                return res.status(404).json({ message: 'Klienti nuk u gjet!' });
            }
            res.json(customer);
        } catch (error) {
            console.error('Error fetching customer:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Create new customer
    createCustomer: async (req, res) => {
        try {
            const { emri, mbiemri, telefoni, vendi } = req.body;

            // Validate required fields
            if (!emri || !mbiemri || !telefoni || !vendi) {
                return res.status(400).json({ message: 'Të gjitha fushat janë të detyrueshme!' });
            }

            const customer = await Customer.create({
                emri,
                mbiemri,
                telefoni,
                vendi
            });

            res.status(201).json(customer);
        } catch (error) {
            console.error('Error creating customer:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Update customer
    updateCustomer: async (req, res) => {
        try {
            const { id } = req.params;
            const { emri, mbiemri, telefoni, vendi } = req.body;

            const customer = await Customer.findByPk(id);
            if (!customer) {
                return res.status(404).json({ message: 'Klienti nuk u gjet!' });
            }

            await customer.update({
                emri: emri || customer.emri,
                mbiemri: mbiemri || customer.mbiemri,
                telefoni: telefoni || customer.telefoni,
                vendi: vendi || customer.vendi
            });

            res.json(customer);
        } catch (error) {
            console.error('Error updating customer:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Delete customer
    deleteCustomer: async (req, res) => {
        try {
            const { id } = req.params;

            const customer = await Customer.findByPk(id);
            if (!customer) {
                return res.status(404).json({ message: 'Klienti nuk u gjet!' });
            }

            // Check if customer has associated orders
            const orderCount = await Order.count({ where: { customerId: id } });
            if (orderCount > 0) {
                return res.status(400).json({ 
                    message: 'Klienti nuk mund të fshihet sepse ka porosi të lidhura me të!',
                    orderCount
                });
            }

            await customer.destroy();
            res.json({ message: 'Klienti u fshi me sukses!' });
        } catch (error) {
            console.error('Error deleting customer:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Search customers
    searchCustomers: async (req, res) => {
        try {
            const { query } = req.query;
            if (!query) {
                return res.status(400).json({ message: 'Kërkesa e kërkimit është e detyrueshme!' });
            }

            const customers = await Customer.findAll({
                where: {
                    [Op.or]: [
                        { emri: { [Op.iLike]: `%${query}%` } },
                        { mbiemri: { [Op.iLike]: `%${query}%` } },
                        { telefoni: { [Op.iLike]: `%${query}%` } },
                        { vendi: { [Op.iLike]: `%${query}%` } }
                    ]
                },
                limit: 10
            });

            res.json(customers);
        } catch (error) {
            console.error('Error searching customers:', error);
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    }
};

module.exports = customerController; 