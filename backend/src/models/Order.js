const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipiPorosise: {
        type: DataTypes.ENUM('derë garazhi', 'kapak', 'derë dhome', 'derë garazhi + kapak'),
        allowNull: false
    },
    shitesi: {
        type: DataTypes.STRING,
        allowNull: false
    },
    pershkrimi: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Order; 