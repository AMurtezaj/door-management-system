const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailyCapacity = sequelize.define('DailyCapacity', {
    dita: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    dyerGarazhi: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 8
    },
    kapake: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3
    }
});

module.exports = DailyCapacity; 