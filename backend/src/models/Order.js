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
        allowNull: false
    },
    dataMatjes: {
        type: DataTypes.DATE,
        allowNull: false
    },
    cmimiTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    pagesaMbetur: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    kaparja: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    menyraPageses: {
        type: DataTypes.ENUM('kesh', 'banke'),
        allowNull: false
    },
    dita: {
        type: DataTypes.STRING,
        allowNull: false
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
        type: DataTypes.ENUM('e përfunduar', 'borxh', 'në proces'),
        defaultValue: 'në proces'
    },
    dataPerfundimit: {
        type: DataTypes.DATE,
        allowNull: true
    },
    eshtePrintuar: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    kaVule: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    dataNjoftimit: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

module.exports = Order; 