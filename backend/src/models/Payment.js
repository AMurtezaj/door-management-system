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
    sasia: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Quantity of products ordered'
    },
    cmimiNjesite: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Unit price per product'
    },
    cmimiTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        comment: 'Total price - can be null for incomplete orders'
    },
    kaparja: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Total payments made so far (including initial down payment and partial payments)'
    },
    kaparaReceiver: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Person who received the last payment'
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