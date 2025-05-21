const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderDetails = sequelize.define('OrderDetails', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    matesi: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dataMatjes: {
        type: DataTypes.DATE,
        allowNull: true
    },
    sender: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Personi që dërgoi porosinë'
    },
    installer: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Personi që do të montojë derën'
    },
    dita: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    statusi: {
        type: DataTypes.ENUM('në proces', 'e përfunduar', 'borxh'),
        defaultValue: 'në proces'
    },
    eshtePrintuar: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    kaVule: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    statusiMatjes: {
        type: DataTypes.ENUM('e pamatur', 'e matur'),
        defaultValue: 'e pamatur'
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

module.exports = OrderDetails; 