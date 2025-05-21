const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    emri: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mbiemri: {
        type: DataTypes.STRING,
        allowNull: false
    },
    telefoni: {
        type: DataTypes.STRING,
        allowNull: false
    },
    vendi: {
        type: DataTypes.STRING,
        allowNull: false
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

module.exports = Customer; 