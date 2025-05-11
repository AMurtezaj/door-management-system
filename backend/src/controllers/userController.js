const User = require('../models/User');
const jwt = require('jsonwebtoken');

const userController = {
    // Create first admin
    createFirstAdmin: async (req, res) => {
        try {
            // Check if any admin exists
            const adminExists = await User.findOne({ where: { roli: 'admin' } });
            if (adminExists) {
                return res.status(400).json({ message: 'Një administrator ekziston tashmë!' });
            }

            const { emri, mbiemri, email, password } = req.body;
            
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email-i ekziston tashmë!' });
            }

            const user = await User.create({
                emri,
                mbiemri,
                email,
                password,
                roli: 'admin' // Force role to be admin
            });

            res.status(201).json({ message: 'Administratori u krijua me sukses!' });
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Register new user (admin only)
    register: async (req, res) => {
        try {
            const { emri, mbiemri, email, password, roli } = req.body;
            
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'Email-i ekziston tashmë!' });
            }

            const user = await User.create({
                emri,
                mbiemri,
                email,
                password,
                roli
            });

            res.status(201).json({ message: 'Përdoruesi u krijua me sukses!' });
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({ message: 'Email ose fjalëkalimi i gabuar!' });
            }

            const isValidPassword = await user.validPassword(password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Email ose fjalëkalimi i gabuar!' });
            }

            const token = jwt.sign(
                { id: user.id, roli: user.roli },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    emri: user.emri,
                    mbiemri: user.mbiemri,
                    email: user.email,
                    roli: user.roli
                }
            });
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get current user
    getCurrentUser: async (req, res) => {
        try {
            const user = await User.findByPk(req.user.id, {
                attributes: { exclude: ['password'] }
            });
            res.json(user);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },
    
    // Get all users (admin only)
    getAllUsers: async (req, res) => {
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']]
            });
            res.json(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ message: 'Diçka shkoi keq gjatë marrjes së përdoruesve!' });
        }
    }
};

module.exports = userController; 