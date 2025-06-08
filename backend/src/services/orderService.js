const { sequelize, Order, Customer, Payment, OrderDetails, SupplementaryOrder } = require('../models');
const NotificationService = require('./notificationService');

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

            // Handle quantity and pricing
            const sasia = orderData.sasia && orderData.sasia !== '' ? parseInt(orderData.sasia) : 1;
            let totalAmount = 0;
            let cmimiNjesite = null;

            if (orderData.cmimiNjesite && orderData.cmimiNjesite !== '') {
                // Unit price provided - calculate total
                cmimiNjesite = parseFloat(orderData.cmimiNjesite);
                totalAmount = cmimiNjesite * sasia;
            } else if (orderData.cmimiTotal && orderData.cmimiTotal !== '') {
                // Total price provided - calculate unit price
                totalAmount = parseFloat(orderData.cmimiTotal);
                cmimiNjesite = totalAmount / sasia;
            }

            // Create payment information
            const isPaid = orderData.isPaymentDone === true;
            const advanceAmount = orderData.kaparja && orderData.kaparja !== '' ? parseFloat(orderData.kaparja) : 0;
            const pagesaMbeturCalculated = totalAmount - advanceAmount;
            
            // For backward compatibility, set old statusi field based on payment
            let statusi = 'në proces';
            let debtType = 'none';
            
            // Only calculate debt if there's a total amount
            if (totalAmount > 0) {
                if (!isPaid && pagesaMbeturCalculated > 0) {
                    statusi = 'borxh';
                    debtType = orderData.menyraPageses; // 'kesh' or 'banke'
                } else if (isPaid || pagesaMbeturCalculated <= 0) {
                    statusi = 'e përfunduar';
                    debtType = 'none';
                }
            }

            await Payment.create({
                orderId: order.id,
                sasia: sasia,
                cmimiNjesite: cmimiNjesite,
                cmimiTotal: totalAmount,
                kaparja: advanceAmount,
                kaparaReceiver: orderData.kaparaReceiver,
                menyraPageses: orderData.menyraPageses,
                isPaymentDone: isPaid,
                debtType: debtType
            }, { transaction: t });

            // Create order details
            await OrderDetails.create({
                orderId: order.id,
                sasia: sasia,
                matesi: orderData.matesi,
                dataMatjes: orderData.dataMatjes,
                sender: orderData.sender,
                installer: orderData.installer,
                dita: orderData.dita,
                statusi: statusi, // Keep for backward compatibility
                statusiProduktit: orderData.statusiProduktit || 'në proces', // New field for product status
                eshtePrintuar: orderData.eshtePrintuar,
                statusiMatjes: orderData.statusiMatjes || 'e pamatur',
                gjatesia: orderData.gjatesia,
                gjeresia: orderData.gjeresia,
                profiliLarte: orderData.profiliLarte || 0,
                profiliPoshtem: orderData.profiliPoshtem || 0,
                isIncomplete: orderData.isIncomplete || false
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
                // Handle quantity and pricing updates
                const newSasia = orderData.sasia !== undefined ? parseInt(orderData.sasia) : parseInt(payment.sasia || 1);
                let newCmimiTotal = 0;
                let newCmimiNjesite = null;

                if (orderData.cmimiNjesite !== undefined && orderData.cmimiNjesite !== '') {
                    // Unit price provided - calculate total
                    newCmimiNjesite = parseFloat(orderData.cmimiNjesite);
                    newCmimiTotal = newCmimiNjesite * newSasia;
                } else if (orderData.cmimiTotal !== undefined && orderData.cmimiTotal !== '') {
                    // Total price provided - calculate unit price
                    newCmimiTotal = parseFloat(orderData.cmimiTotal);
                    newCmimiNjesite = newCmimiTotal / newSasia;
                } else {
                    // Neither provided - use existing values and recalculate if quantity changed
                    const existingUnitPrice = parseFloat(payment.cmimiNjesite || 0);
                    const existingTotal = parseFloat(payment.cmimiTotal || 0);
                    
                    if (existingUnitPrice > 0) {
                        newCmimiNjesite = existingUnitPrice;
                        newCmimiTotal = existingUnitPrice * newSasia;
                    } else if (existingTotal > 0) {
                        newCmimiTotal = existingTotal;
                        newCmimiNjesite = existingTotal / newSasia;
                    }
                }

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
                    sasia: newSasia,
                    cmimiNjesite: newCmimiNjesite,
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
                        sasia: newSasia,
                        matesi: orderData.matesi !== undefined ? orderData.matesi : orderDetails.matesi,
                        dataMatjes: orderData.dataMatjes !== undefined ? orderData.dataMatjes : orderDetails.dataMatjes,
                        sender: orderData.sender !== undefined ? orderData.sender : orderDetails.sender,
                        installer: orderData.installer !== undefined ? orderData.installer : orderDetails.installer,
                        dita: orderData.dita !== undefined ? orderData.dita : orderDetails.dita,
                        statusi: orderData.statusi !== undefined ? orderData.statusi : statusi, // Keep for backward compatibility
                        statusiProduktit: orderData.statusiProduktit !== undefined ? orderData.statusiProduktit : orderDetails.statusiProduktit, // Don't change product status unless explicitly set
                        eshtePrintuar: orderData.eshtePrintuar !== undefined ? orderData.eshtePrintuar : orderDetails.eshtePrintuar,
                        statusiMatjes: orderData.statusiMatjes !== undefined ? orderData.statusiMatjes : orderDetails.statusiMatjes,
                        gjatesia: orderData.gjatesia !== undefined ? orderData.gjatesia : orderDetails.gjatesia,
                        gjeresia: orderData.gjeresia !== undefined ? orderData.gjeresia : orderDetails.gjeresia,
                        profiliLarte: orderData.profiliLarte !== undefined ? orderData.profiliLarte : orderDetails.profiliLarte,
                        profiliPoshtem: orderData.profiliPoshtem !== undefined ? orderData.profiliPoshtem : orderDetails.profiliPoshtem,
                        isIncomplete: orderData.isIncomplete !== undefined ? orderData.isIncomplete : orderDetails.isIncomplete
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
            let debtType = 'none';
            
            if (!isPaymentDone && pagesaMbeturCalculated > 0) {
                debtType = payment.menyraPageses;
            }

            await payment.update({
                isPaymentDone,
                debtType
            }, { transaction: t });

            // Update order details - do NOT change the order status based on payment
            // The order status should purely reflect the product status
            const orderDetails = await OrderDetails.findOne({ where: { orderId }, transaction: t });
            if (orderDetails) {
                // Keep the status as the actual product status, regardless of payment
                await orderDetails.update({
                    statusi: orderDetails.statusiProduktit  // Always use product status
                }, { transaction: t });
            }

            return await getCompleteOrderById(orderId);
        });
    },

    // New function to handle partial payments
    addPartialPayment: async (orderId, paymentAmount, paymentReceiver = null) => {
        return await sequelize.transaction(async (t) => {
            const payment = await Payment.findOne({ where: { orderId }, transaction: t });
            if (!payment) {
                throw new Error('Payment not found');
            }

            // Validate payment amount
            const currentTotal = parseFloat(payment.cmimiTotal);
            const currentPaid = parseFloat(payment.kaparja);
            const remainingDebt = currentTotal - currentPaid;
            const newPaymentAmount = parseFloat(paymentAmount);

            if (isNaN(newPaymentAmount) || newPaymentAmount <= 0) {
                throw new Error('Shuma e pagesës duhet të jetë një numër pozitiv!');
            }

            if (newPaymentAmount > remainingDebt) {
                throw new Error(`Shuma e pagesës (€${newPaymentAmount.toFixed(2)}) nuk mund të jetë më e madhe se borxhi i mbetur (€${remainingDebt.toFixed(2)})!`);
            }

            // Calculate new totals
            const newTotalPaid = currentPaid + newPaymentAmount;
            const newRemainingDebt = currentTotal - newTotalPaid;
            const isFullyPaid = newRemainingDebt <= 0.01; // Allow for small rounding errors

            // Update payment record
            await payment.update({
                kaparja: newTotalPaid,
                isPaymentDone: isFullyPaid,
                debtType: isFullyPaid ? 'none' : payment.menyraPageses,
                kaparaReceiver: paymentReceiver || payment.kaparaReceiver // Update receiver if provided
            }, { transaction: t });

            // Order status remains unchanged (purely reflects product status)
            const orderDetails = await OrderDetails.findOne({ where: { orderId }, transaction: t });
            if (orderDetails) {
                await orderDetails.update({
                    statusi: orderDetails.statusiProduktit  // Always use product status
                }, { transaction: t });
            }

            return await getCompleteOrderById(orderId);
        });
    },

    // New function to update product status separately
    updateProductStatus: async (orderId, statusiProduktit) => {
        return await sequelize.transaction(async (t) => {
            const orderDetails = await OrderDetails.findOne({ where: { orderId }, transaction: t });
            if (!orderDetails) {
                throw new Error('Order details not found');
            }

            await orderDetails.update({
                statusiProduktit,
                statusi: statusiProduktit  // Always keep statusi equal to statusiProduktit
            }, { transaction: t });

            return await getCompleteOrderById(orderId);
        });
    },

    // Cancel partial payment (reduce kaparja by specified amount)
    cancelPartialPayment: async (orderId, cancellationAmount) => {
        const transaction = await sequelize.transaction();
        
        try {
            // Get the order with payment info
            const order = await Order.findByPk(orderId, {
                include: [
                    { model: Customer },
                    { model: Payment },
                    { model: OrderDetails, as: 'OrderDetail' }
                ],
                transaction
            });

            if (!order) {
                throw new Error('Porosia nuk u gjet');
            }

            const currentKaparja = parseFloat(order.Payment.kaparja || 0);
            const totalAmount = parseFloat(order.Payment.cmimiTotal || 0);
            const amountToCancel = parseFloat(cancellationAmount);

            // Validation
            if (amountToCancel <= 0) {
                throw new Error('Shuma e anulimit duhet të jetë pozitive');
            }

            if (amountToCancel > currentKaparja) {
                throw new Error(`Nuk mund të anuloni më shumë se sa është paguar (€${currentKaparja.toFixed(2)})`);
            }

            // Calculate new amounts
            const newKaparja = currentKaparja - amountToCancel;
            const remainingDebt = totalAmount - newKaparja;
            const isPaymentDone = remainingDebt <= 0.01; // Consider paid if debt is negligible

            // Update payment record
            await order.Payment.update({
                kaparja: newKaparja.toFixed(2),
                isPaymentDone: isPaymentDone
            }, { transaction });

            // Create notification for payment cancellation
            await NotificationService.createNotification({
                type: 'payment_cancelled',
                title: 'Pagesa u Anulua',
                message: `Pagesa prej €${amountToCancel.toFixed(2)} u anulua për porosinë #${orderId}. Borxh i ri: €${remainingDebt.toFixed(2)}`,
                orderId: orderId,
                metadata: {
                    cancelledAmount: amountToCancel,
                    newKaparja: newKaparja,
                    newDebt: remainingDebt,
                    customerName: `${order.Customer.emriKlientit} ${order.Customer.mbiemriKlientit}`
                }
            }, transaction);

            await transaction.commit();

            // Return updated order
            const updatedOrder = await Order.findByPk(orderId, {
                include: [
                    { model: Customer },
                    { model: Payment },
                    { model: OrderDetails, as: 'OrderDetail' }
                ]
            });

            return {
                success: true,
                message: `Pagesa prej €${amountToCancel.toFixed(2)} u anulua me sukses. Borxh i ri: €${remainingDebt.toFixed(2)}`,
                order: updatedOrder,
                cancelledAmount: amountToCancel,
                newKaparja: newKaparja,
                newDebt: remainingDebt
            };

        } catch (error) {
            await transaction.rollback();
            console.error('Error cancelling partial payment:', error);
            throw error;
        }
    }
};

// Helper function to get complete order by ID
async function getCompleteOrderById(id) {
    return await Order.findByPk(id, {
        include: [
            { model: Customer },
            { model: Payment },
            { model: OrderDetails, as: 'OrderDetail' },
            { model: SupplementaryOrder }
        ]
    });
}

module.exports = {
    createCompleteOrder: orderService.createCompleteOrder,
    updateCompleteOrder: orderService.updateCompleteOrder,
    updatePaymentStatus: orderService.updatePaymentStatus,
    addPartialPayment: orderService.addPartialPayment,
    updateProductStatus: orderService.updateProductStatus,
    cancelPartialPayment: orderService.cancelPartialPayment
}; 