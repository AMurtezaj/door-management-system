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
            
            console.log('Login attempt for:', email);
            
            const user = await User.findOne({ where: { email } });
            if (!user) {
                console.log('Login failed: User not found with email', email);
                return res.status(401).json({ message: 'Email ose fjalëkalimi i gabuar!' });
            }

            const isValidPassword = await user.validPassword(password);
            if (!isValidPassword) {
                console.log('Login failed: Invalid password for user', email);
                return res.status(401).json({ message: 'Email ose fjalëkalimi i gabuar!' });
            }

            // Make sure JWT_SECRET is available
            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET is not defined in environment variables');
                return res.status(500).json({ message: 'Server configuration error' });
            }

            try {
                const token = jwt.sign(
                    { id: user.id, roli: user.roli },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                console.log('Login successful for user:', email);
                
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
            } catch (jwtError) {
                console.error('JWT signing error:', jwtError);
                return res.status(500).json({ message: 'Failed to generate authentication token' });
            }
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Diçka shkoi keq!' });
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
    },

    // Update a user (admin only)
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { emri, mbiemri, email, roli } = req.body;
            
            // Check if user exists
            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ message: 'Përdoruesi nuk u gjet!' });
            }
            
            // If email is being changed, check if the new email already exists
            if (email && email !== user.email) {
                const existingUser = await User.findOne({ where: { email } });
                if (existingUser) {
                    return res.status(400).json({ message: 'Email-i ekziston tashmë!' });
                }
            }
            
            // Update user fields
            if (emri) user.emri = emri;
            if (mbiemri) user.mbiemri = mbiemri;
            if (email) user.email = email;
            if (roli) user.roli = roli;
            
            // If password is included, it will be handled by the model hooks
            if (req.body.password) {
                user.password = req.body.password;
            }
            
            await user.save();
            
            // Return updated user without password
            const updatedUser = await User.findByPk(id, {
                attributes: { exclude: ['password'] }
            });
            
            res.json({
                message: 'Përdoruesi u përditësua me sukses!',
                user: updatedUser
            });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ message: 'Diçka shkoi keq gjatë përditësimit të përdoruesit!' });
        }
    },
    
    // Delete a user (admin only)
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Check if user exists
            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({ message: 'Përdoruesi nuk u gjet!' });
            }
            
            // Prevent deleting the last admin
            if (user.roli === 'admin') {
                const adminCount = await User.count({ where: { roli: 'admin' } });
                if (adminCount <= 1) {
                    return res.status(400).json({ message: 'Nuk mund të fshihet administratori i fundit!' });
                }
            }
            
            // Delete user
            await user.destroy();
            
            res.json({ message: 'Përdoruesi u fshi me sukses!' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ message: 'Diçka shkoi keq gjatë fshirjes së përdoruesit!' });
        }
    },

    // Get user by ID (admin only)
    getUserById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const user = await User.findByPk(id, {
                attributes: { exclude: ['password'] }
            });
            
            if (!user) {
                return res.status(404).json({ message: 'Përdoruesi nuk u gjet!' });
            }
            
            res.json(user);
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({ message: 'Diçka shkoi keq gjatë marrjes së përdoruesit!' });
        }
    }
};

module.exports = userController; 