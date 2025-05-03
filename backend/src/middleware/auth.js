const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Nuk keni akses!' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'Përdoruesi nuk u gjet!' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Nuk keni akses!' });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        if (req.user.roli !== 'admin') {
            return res.status(403).json({ message: 'Vetëm adminët kanë akses!' });
        }
        next();
    } catch (error) {
        res.status(403).json({ message: 'Nuk keni akses!' });
    }
};

module.exports = { auth, isAdmin }; 