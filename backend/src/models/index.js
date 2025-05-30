const { sequelize } = require('../config/database');
const Order = require('./Order');
const Customer = require('./Customer');
const Payment = require('./Payment');
const OrderDetails = require('./OrderDetails');
const Notification = require('./Notification');
const SupplementaryOrder = require('./SupplementaryOrder');

// Order to Customer relationship (many-to-one)
Order.belongsTo(Customer, { foreignKey: 'customerId' });
Customer.hasMany(Order, { foreignKey: 'customerId' });

// Order to Payment relationship (one-to-one)
Order.hasOne(Payment, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

// Order to OrderDetails relationship (one-to-one)
Order.hasOne(OrderDetails, { foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderDetails.belongsTo(Order, { foreignKey: 'orderId' });

// Order to Notification relationship (existing)
Order.hasMany(Notification, { foreignKey: 'orderId' });
Notification.belongsTo(Order, { foreignKey: 'orderId' });

// Order to SupplementaryOrder relationship (one-to-many)
Order.hasMany(SupplementaryOrder, { foreignKey: 'parentOrderId', onDelete: 'CASCADE' });
SupplementaryOrder.belongsTo(Order, { foreignKey: 'parentOrderId', as: 'ParentOrder' });

module.exports = {
    sequelize,
    Order,
    Customer,
    Payment,
    OrderDetails,
    Notification,
    SupplementaryOrder
}; 