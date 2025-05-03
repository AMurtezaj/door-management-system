const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    shuma: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    menyraPageses: {
        type: DataTypes.ENUM('kesh', 'banke'),
        allowNull: false
    },
    dataPageses: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    pershkrimi: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    statusi: {
        type: DataTypes.ENUM('e kryer', 'e anuluar'),
        defaultValue: 'e kryer'
    },
    eshteKonfirmuar: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    dataKonfirmimit: {
        type: DataTypes.DATE,
        allowNull: true
    },
    numriTransaksionit: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Payment; 