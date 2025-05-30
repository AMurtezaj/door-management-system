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
    gjatesia: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Gjatësia e derës (input value)'
    },
    gjeresia: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Gjerësia e derës (input value)'
    },
    profiliLarte: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        comment: 'Profili i lartë - zbritet nga gjatësia'
    },
    profiliPoshtem: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        comment: 'Profili i poshtëm - zbritet nga gjerësia'
    },
    // Virtual fields for calculated dimensions
    gjatesiaFinale: {
        type: DataTypes.VIRTUAL,
        get() {
            const gjatesia = parseFloat(this.getDataValue('gjatesia')) || 0;
            const profiliLarte = parseFloat(this.getDataValue('profiliLarte')) || 0;
            return gjatesia - profiliLarte;
        }
    },
    gjeresiaFinale: {
        type: DataTypes.VIRTUAL,
        get() {
            const gjeresia = parseFloat(this.getDataValue('gjeresia')) || 0;
            const profiliPoshtem = parseFloat(this.getDataValue('profiliPoshtem')) || 0;
            return gjeresia - profiliPoshtem;
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    // Instance methods
    instanceMethods: {
        calculateFinalDimensions() {
            return {
                gjatesiaFinale: this.gjatesiaFinale,
                gjeresiaFinale: this.gjeresiaFinale,
                dimensionData: {
                    gjatesia: {
                        input: parseFloat(this.gjatesia) || 0,
                        profili: parseFloat(this.profiliLarte) || 0,
                        finale: this.gjatesiaFinale
                    },
                    gjeresia: {
                        input: parseFloat(this.gjeresia) || 0,
                        profili: parseFloat(this.profiliPoshtem) || 0,
                        finale: this.gjeresiaFinale
                    }
                }
            };
        }
    }
});

// Instance method to get dimension calculations
OrderDetails.prototype.getDimensionCalculations = function() {
    return {
        gjatesiaFinale: this.gjatesiaFinale,
        gjeresiaFinale: this.gjeresiaFinale,
        dimensionData: {
            gjatesia: {
                input: parseFloat(this.gjatesia) || 0,
                profili: parseFloat(this.profiliLarte) || 0,
                finale: this.gjatesiaFinale
            },
            gjeresia: {
                input: parseFloat(this.gjeresia) || 0,
                profili: parseFloat(this.profiliPoshtem) || 0,
                finale: this.gjeresiaFinale
            }
        }
    };
};

module.exports = OrderDetails; 