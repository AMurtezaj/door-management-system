const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cmimiTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    kaparja: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    kaparaReceiver: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Personi që mori kaparën'
    },
    pagesaMbetur: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.cmimiTotal - this.kaparja;
        }
    },
    menyraPageses: {
        type: DataTypes.ENUM('kesh', 'banke'),
        allowNull: false
    },
    isPaymentDone: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    debtType: {
        type: DataTypes.ENUM('kesh', 'banke', 'none'),
        defaultValue: 'none'
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

module.exports = Payment; 