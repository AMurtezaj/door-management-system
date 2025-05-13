const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    emriKlientit: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mbiemriKlientit: {
        type: DataTypes.STRING,
        allowNull: false
    },
    numriTelefonit: {
        type: DataTypes.STRING,
        allowNull: false
    },
    vendi: {
        type: DataTypes.STRING,
        allowNull: false
    },
    shitesi: {
        type: DataTypes.STRING,
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
    cmimiTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    kaparja: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
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
    dita: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    tipiPorosise: {
        type: DataTypes.ENUM('derë garazhi', 'kapak', 'derë dhome'),
        allowNull: false
    },
    pershkrimi: {
        type: DataTypes.TEXT,
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
    }
});

// Add association with Notification model
const Notification = require('./Notification');
Order.hasMany(Notification, { foreignKey: 'orderId' });
Notification.belongsTo(Order, { foreignKey: 'orderId' });

module.exports = Order; 