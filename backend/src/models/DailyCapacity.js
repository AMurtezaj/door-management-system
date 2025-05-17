const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyCapacity = sequelize.define('DailyCapacity', {
    dita: {
        type: DataTypes.DATEONLY, // Changed to DATEONLY
        allowNull: false,
        unique: true
    },
    dyerGarazhi: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    kapake: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

module.exports = DailyCapacity; 