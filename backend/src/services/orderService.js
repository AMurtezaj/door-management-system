const { sequelize, Order, Customer, Payment, OrderDetails } = require('../models');

const orderService = {
    createCompleteOrder: async (orderData) => {
        const result = await sequelize.transaction(async (t) => {
            // Find or create customer
            let customer;
            if (orderData.customerId) {
                customer = await Customer.findByPk(orderData.customerId, { transaction: t });
                if (!customer) {
                    throw new Error('Customer not found');
                }
            } else {
                customer = await Customer.create({
                    emri: orderData.emriKlientit,
                    mbiemri: orderData.mbiemriKlientit,
                    telefoni: orderData.numriTelefonit,
                    vendi: orderData.vendi
                }, { transaction: t });
            }

            // Create the order
            const order = await Order.create({
                customerId: customer.id,
                tipiPorosise: orderData.tipiPorosise,
                shitesi: orderData.shitesi,
                pershkrimi: orderData.pershkrimi
            }, { transaction: t });

            // Create payment information
            const isPaid = orderData.isPaymentDone === true;
            const pagesaMbeturCalculated = parseFloat(orderData.cmimiTotal) - parseFloat(orderData.kaparja || 0);
            
            let statusi = 'në proces';
            let debtType = 'none';
            
            if (!isPaid && pagesaMbeturCalculated > 0) {
                statusi = 'borxh';
                debtType = orderData.menyraPageses; // 'kesh' or 'banke'
            } else if (isPaid || pagesaMbeturCalculated <= 0) {
                statusi = 'e përfunduar';
                debtType = 'none';
            }

            await Payment.create({
                orderId: order.id,
                cmimiTotal: orderData.cmimiTotal,
                kaparja: orderData.kaparja || 0,
                kaparaReceiver: orderData.kaparaReceiver,
                menyraPageses: orderData.menyraPageses,
                isPaymentDone: isPaid,
                debtType: debtType
            }, { transaction: t });

            // Create order details
            await OrderDetails.create({
                orderId: order.id,
                matesi: orderData.matesi,
                dataMatjes: orderData.dataMatjes,
                sender: orderData.sender,
                installer: orderData.installer,
                dita: orderData.dita,
                statusi: statusi,
                eshtePrintuar: orderData.eshtePrintuar,
                kaVule: orderData.kaVule,
                statusiMatjes: orderData.statusiMatjes || 'e pamatur'
            }, { transaction: t });

            return order;
        });

        // Return the complete order with all related data
        return await getCompleteOrderById(result.id);
    },

    updateCompleteOrder: async (orderId, orderData) => {
        const result = await sequelize.transaction(async (t) => {
            // Get existing order
            const order = await Order.findByPk(orderId, { transaction: t });
            if (!order) {
                throw new Error('Order not found');
            }

            // Update customer if customer data is provided
            if (orderData.emriKlientit || orderData.mbiemriKlientit || orderData.numriTelefonit || orderData.vendi) {
                const customer = await Customer.findByPk(order.customerId, { transaction: t });
                if (customer) {
                    await customer.update({
                        emri: orderData.emriKlientit !== undefined ? orderData.emriKlientit : customer.emri,
                        mbiemri: orderData.mbiemriKlientit !== undefined ? orderData.mbiemriKlientit : customer.mbiemri,
                        telefoni: orderData.numriTelefonit !== undefined ? orderData.numriTelefonit : customer.telefoni,
                        vendi: orderData.vendi !== undefined ? orderData.vendi : customer.vendi
                    }, { transaction: t });
                }
            }

            // Update order basic info
            await order.update({
                tipiPorosise: orderData.tipiPorosise !== undefined ? orderData.tipiPorosise : order.tipiPorosise,
                shitesi: orderData.shitesi !== undefined ? orderData.shitesi : order.shitesi,
                pershkrimi: orderData.pershkrimi !== undefined ? orderData.pershkrimi : order.pershkrimi
            }, { transaction: t });

            // Update payment
            const payment = await Payment.findOne({ where: { orderId }, transaction: t });
            if (payment) {
                // Get the new values or use the existing ones
                const newCmimiTotal = orderData.cmimiTotal !== undefined ? parseFloat(orderData.cmimiTotal) : parseFloat(payment.cmimiTotal);
                const newKaparja = orderData.kaparja !== undefined ? parseFloat(orderData.kaparja) : parseFloat(payment.kaparja);
                const isPaid = orderData.isPaymentDone !== undefined ? orderData.isPaymentDone : payment.isPaymentDone;
                const pagesaMbeturCalculated = newCmimiTotal - newKaparja;
                const currentMenyraPageses = orderData.menyraPageses || payment.menyraPageses;
                
                let statusi = 'në proces';
                let debtType = 'none';
                
                if (!isPaid && pagesaMbeturCalculated > 0) {
                    statusi = 'borxh';
                    debtType = currentMenyraPageses;
                } else if (isPaid || pagesaMbeturCalculated <= 0) {
                    statusi = 'e përfunduar';
                    debtType = 'none';
                }

                await payment.update({
                    cmimiTotal: newCmimiTotal,
                    kaparja: newKaparja,
                    kaparaReceiver: orderData.kaparaReceiver !== undefined ? orderData.kaparaReceiver : payment.kaparaReceiver,
                    menyraPageses: currentMenyraPageses,
                    isPaymentDone: isPaid,
                    debtType: debtType
                }, { transaction: t });
                
                // Update order details
                const orderDetails = await OrderDetails.findOne({ where: { orderId }, transaction: t });
                if (orderDetails) {
                    await orderDetails.update({
                        matesi: orderData.matesi !== undefined ? orderData.matesi : orderDetails.matesi,
                        dataMatjes: orderData.dataMatjes !== undefined ? orderData.dataMatjes : orderDetails.dataMatjes,
                        sender: orderData.sender !== undefined ? orderData.sender : orderDetails.sender,
                        installer: orderData.installer !== undefined ? orderData.installer : orderDetails.installer,
                        dita: orderData.dita !== undefined ? orderData.dita : orderDetails.dita,
                        statusi: orderData.statusi !== undefined ? orderData.statusi : statusi,
                        eshtePrintuar: orderData.eshtePrintuar !== undefined ? orderData.eshtePrintuar : orderDetails.eshtePrintuar,
                        kaVule: orderData.kaVule !== undefined ? orderData.kaVule : orderDetails.kaVule,
                        statusiMatjes: orderData.statusiMatjes !== undefined ? orderData.statusiMatjes : orderDetails.statusiMatjes
                    }, { transaction: t });
                }
            }

            return order;
        });

        // Return the complete updated order
        return await getCompleteOrderById(orderId);
    },

    updatePaymentStatus: async (orderId, isPaymentDone) => {
        return await sequelize.transaction(async (t) => {
            const payment = await Payment.findOne({ where: { orderId }, transaction: t });
            if (!payment) {
                throw new Error('Payment not found');
            }

            const pagesaMbeturCalculated = parseFloat(payment.cmimiTotal) - parseFloat(payment.kaparja);
            
            let statusi = 'në proces';
            let debtType = 'none';
            
            if (!isPaymentDone && pagesaMbeturCalculated > 0) {
                statusi = 'borxh';
                debtType = payment.menyraPageses;
            } else if (isPaymentDone || pagesaMbeturCalculated <= 0) {
                statusi = 'e përfunduar';
                debtType = 'none';
            }

            await payment.update({
                isPaymentDone,
                debtType
            }, { transaction: t });

            // Update order details status
            const orderDetails = await OrderDetails.findOne({ where: { orderId }, transaction: t });
            if (orderDetails) {
                await orderDetails.update({
                    statusi
                }, { transaction: t });
            }

            return await getCompleteOrderById(orderId);
        });
    }
};

// Helper function to get complete order by ID
async function getCompleteOrderById(id) {
    return await Order.findByPk(id, {
        include: [
            { model: Customer },
            { model: Payment },
            { model: OrderDetails }
        ]
    });
}

module.exports = orderService; 