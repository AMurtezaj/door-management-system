const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const capacityRoutes = require('./routes/capacityRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/capacity', capacityRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Diçka shkoi keq!' });
});

// Sync database and start server
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database synced successfully');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to sync database:', err);
    }); 