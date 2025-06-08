const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SupplementaryOrder = sequelize.define('SupplementaryOrder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    parentOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID e porosisë kryesore (derë garazhi) me të cilën lidhet'
    },
    emriKlientit: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Emri i klientit për porosinë shtesë'
    },
    mbiemriKlientit: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Mbiemri i klientit për porosinë shtesë'
    },
    numriTelefonit: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Numri i telefonit të klientit'
    },
    vendi: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Lokacioni i dërgimit (duhet të jetë i njëjtë me porosinë kryesore)'
    },
    pershkrimiProduktit: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Përshkrimi i produktit shtesë (keramika, etj.)'
    },
    sasia: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Quantity of supplementary products ordered'
    },
    cmimiNjesite: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Unit price per supplementary product'
    },
    cmimiTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Çmimi total i produktit shtesë'
    },
    kaparja: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: 'Kaparja e paguar për produktin shtesë'
    },
    kaparaReceiver: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Personi që ka marrë kaparën për produktin shtesë'
    },
    pagesaMbetur: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Pagesa e mbetur për produktin shtesë'
    },
    menyraPageses: {
        type: DataTypes.ENUM('kesh', 'banke'),
        allowNull: false,
        comment: 'Mënyra e pagesës për produktin shtesë'
    },
    isPaymentDone: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'A është përfunduar pagesa për produktin shtesë'
    },
    statusi: {
        type: DataTypes.ENUM('në proces', 'e përfunduar'),
        defaultValue: 'në proces',
        comment: 'DEPRECATED: Use statusiProduktit instead. Kept for backward compatibility. Now mirrors statusiProduktit.'
    },
    statusiProduktit: {
        type: DataTypes.ENUM('në proces', 'e përfunduar'),
        defaultValue: 'në proces',
        comment: 'Statusi i produktit shtesë (a është gati/dorëzuar)'
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

module.exports = SupplementaryOrder; 