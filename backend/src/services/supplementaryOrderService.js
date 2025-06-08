const { sequelize, Order, Customer, SupplementaryOrder } = require('../models');
const NotificationService = require('./notificationService');

const supplementaryOrderService = {
    /**
     * Create a supplementary order attached to an existing main order
     * @param {Object} supplementaryData - Data for the supplementary order
     * @returns {Object} - Created supplementary order
     */
    createSupplementaryOrder: async (supplementaryData) => {
        return await sequelize.transaction(async (t) => {
            const {
                parentOrderId,
                emriKlientit,
                mbiemriKlientit,
                numriTelefonit,
                vendi,
                pershkrimiProduktit,
                cmimiTotal,
                kaparja,
                kaparaReceiver,
                menyraPageses,
                isPaymentDone
            } = supplementaryData;

            // Validate that the parent order exists and is a garage door order
            const parentOrder = await Order.findByPk(parentOrderId, {
                include: [
                    { model: Customer },
                    { model: require('../models/OrderDetails') }
                ],
                transaction: t
            });

            if (!parentOrder) {
                throw new Error('Porosia kryesore nuk u gjet!');
            }

            if (parentOrder.tipiPorosise !== 'derë garazhi') {
                throw new Error('Porositë shtesë mund të bashkëngjiten vetëm me porositë e dyerve të garazhit!');
            }

            // Validate that the location matches the parent order
            if (parentOrder.Customer.vendi !== vendi) {
                throw new Error(`Lokacioni duhet të jetë i njëjtë me porosinë kryesore: ${parentOrder.Customer.vendi}`);
            }

            // Handle quantity and pricing
            const sasia = supplementaryData.sasia && supplementaryData.sasia !== '' ? parseInt(supplementaryData.sasia) : 1;
            let totalAmount = 0;
            let cmimiNjesite = null;

            if (supplementaryData.cmimiNjesite && supplementaryData.cmimiNjesite !== '') {
                // Unit price provided - calculate total
                cmimiNjesite = parseFloat(supplementaryData.cmimiNjesite);
                totalAmount = cmimiNjesite * sasia;
            } else if (supplementaryData.cmimiTotal && supplementaryData.cmimiTotal !== '') {
                // Total price provided - calculate unit price
                totalAmount = parseFloat(supplementaryData.cmimiTotal);
                cmimiNjesite = totalAmount / sasia;
            }

            // Calculate remaining payment
            const kaparjaAmount = parseFloat(kaparja || 0);
            const pagesaMbetur = totalAmount - kaparjaAmount;

            // Determine status based on payment - for backward compatibility only
            let statusi = 'në proces';
            if (isPaymentDone || pagesaMbetur <= 0) {
                statusi = 'e përfunduar';
            } else if (pagesaMbetur > 0) {
                statusi = 'borxh';
            }

            // Create the supplementary order
            const supplementaryOrder = await SupplementaryOrder.create({
                parentOrderId,
                emriKlientit,
                mbiemriKlientit,
                numriTelefonit,
                vendi,
                pershkrimiProduktit,
                sasia: sasia,
                cmimiNjesite: cmimiNjesite,
                cmimiTotal: totalAmount,
                kaparja: kaparjaAmount,
                kaparaReceiver,
                pagesaMbetur,
                menyraPageses,
                isPaymentDone: isPaymentDone || false,
                statusi, // Keep for backward compatibility
                statusiProduktit: 'në proces' // New field - product starts as 'në proces'
            }, { transaction: t });

            return supplementaryOrder;
        });
    },

    /**
     * Get all supplementary orders for a specific parent order
     * @param {number} parentOrderId - ID of the parent order
     * @returns {Array} - Array of supplementary orders
     */
    getSupplementaryOrdersByParentId: async (parentOrderId) => {
        return await SupplementaryOrder.findAll({
            where: { parentOrderId },
            order: [['createdAt', 'ASC']]
        });
    },

    /**
     * Update a supplementary order
     * @param {number} id - Supplementary order ID
     * @param {Object} updateData - Data to update
     * @returns {Object} - Updated supplementary order
     */
    updateSupplementaryOrder: async (id, updateData) => {
        return await sequelize.transaction(async (t) => {
            const supplementaryOrder = await SupplementaryOrder.findByPk(id, { transaction: t });
            
            if (!supplementaryOrder) {
                throw new Error('Porosia shtesë nuk u gjet!');
            }

            // If location is being updated, validate it matches parent order
            if (updateData.vendi) {
                const parentOrder = await Order.findByPk(supplementaryOrder.parentOrderId, {
                    include: [{ model: Customer }],
                    transaction: t
                });

                if (parentOrder.Customer.vendi !== updateData.vendi) {
                    throw new Error(`Lokacioni duhet të jetë i njëjtë me porosinë kryesore: ${parentOrder.Customer.vendi}`);
                }
            }

            // Recalculate remaining payment if price or advance payment changes
            let pagesaMbetur = supplementaryOrder.pagesaMbetur;
            let statusi = supplementaryOrder.statusi;

            // Handle quantity and pricing updates
            const newSasia = updateData.sasia !== undefined ? parseInt(updateData.sasia) : parseInt(supplementaryOrder.sasia || 1);
            let newCmimiTotal = 0;
            let newCmimiNjesite = null;

            if (updateData.cmimiNjesite !== undefined && updateData.cmimiNjesite !== '') {
                // Unit price provided - calculate total
                newCmimiNjesite = parseFloat(updateData.cmimiNjesite);
                newCmimiTotal = newCmimiNjesite * newSasia;
                updateData.cmimiTotal = newCmimiTotal;
                updateData.cmimiNjesite = newCmimiNjesite;
                updateData.sasia = newSasia;
            } else if (updateData.cmimiTotal !== undefined && updateData.cmimiTotal !== '') {
                // Total price provided - calculate unit price
                newCmimiTotal = parseFloat(updateData.cmimiTotal);
                newCmimiNjesite = newCmimiTotal / newSasia;
                updateData.cmimiNjesite = newCmimiNjesite;
                updateData.sasia = newSasia;
            } else if (updateData.sasia !== undefined) {
                // Only quantity changed - recalculate based on existing unit price
                const existingUnitPrice = parseFloat(supplementaryOrder.cmimiNjesite || 0);
                const existingTotal = parseFloat(supplementaryOrder.cmimiTotal || 0);
                
                if (existingUnitPrice > 0) {
                    newCmimiNjesite = existingUnitPrice;
                    newCmimiTotal = existingUnitPrice * newSasia;
                    updateData.cmimiTotal = newCmimiTotal;
                    updateData.cmimiNjesite = newCmimiNjesite;
                } else if (existingTotal > 0) {
                    newCmimiTotal = existingTotal;
                    newCmimiNjesite = existingTotal / newSasia;
                    updateData.cmimiNjesite = newCmimiNjesite;
                }
            }

            if (updateData.cmimiTotal !== undefined || updateData.kaparja !== undefined) {
                const newTotal = updateData.cmimiTotal !== undefined ? parseFloat(updateData.cmimiTotal) : parseFloat(supplementaryOrder.cmimiTotal);
                const newKaparja = updateData.kaparja !== undefined ? parseFloat(updateData.kaparja) : parseFloat(supplementaryOrder.kaparja);
                pagesaMbetur = newTotal - newKaparja;
                updateData.pagesaMbetur = pagesaMbetur;
            }

            // Update status based on payment - for backward compatibility only
            if (updateData.isPaymentDone !== undefined || updateData.cmimiTotal !== undefined || updateData.kaparja !== undefined) {
                const isPaid = updateData.isPaymentDone !== undefined ? updateData.isPaymentDone : supplementaryOrder.isPaymentDone;
                if (isPaid || pagesaMbetur <= 0) {
                    statusi = 'e përfunduar';
                } else if (pagesaMbetur > 0) {
                    statusi = 'borxh';
                } else {
                    statusi = 'në proces';
                }
                updateData.statusi = statusi;
            }

            // Don't automatically change product status unless explicitly requested
            if (updateData.statusiProduktit === undefined) {
                // Keep existing product status
                updateData.statusiProduktit = supplementaryOrder.statusiProduktit;
            }

            await supplementaryOrder.update(updateData, { transaction: t });
            return supplementaryOrder;
        });
    },

    /**
     * Update payment status of a supplementary order
     * @param {number} id - Supplementary order ID
     * @param {boolean} isPaymentDone - Payment status
     * @returns {Object} - Updated supplementary order
     */
    updateSupplementaryOrderPaymentStatus: async (id, isPaymentDone) => {
        return await sequelize.transaction(async (t) => {
            const supplementaryOrder = await SupplementaryOrder.findByPk(id, { transaction: t });
            
            if (!supplementaryOrder) {
                throw new Error('Porosia shtesë nuk u gjet!');
            }

            // Keep the status as the actual product status, regardless of payment
            await supplementaryOrder.update({
                isPaymentDone,
                statusi: supplementaryOrder.statusiProduktit  // Always use product status
            }, { transaction: t });

            return supplementaryOrder;
        });
    },

    /**
     * Update product status of a supplementary order
     * @param {number} id - Supplementary order ID
     * @param {string} statusiProduktit - Product status ('në proces' or 'e përfunduar')
     * @returns {Object} - Updated supplementary order
     */
    updateSupplementaryOrderProductStatus: async (id, statusiProduktit) => {
        return await sequelize.transaction(async (t) => {
            const supplementaryOrder = await SupplementaryOrder.findByPk(id, { transaction: t });
            
            if (!supplementaryOrder) {
                throw new Error('Porosia shtesë nuk u gjet!');
            }

            await supplementaryOrder.update({
                statusiProduktit,
                statusi: statusiProduktit  // Always keep statusi equal to statusiProduktit
            }, { transaction: t });

            return supplementaryOrder;
        });
    },

    /**
     * Delete a supplementary order
     * @param {number} id - Supplementary order ID
     * @returns {boolean} - Success status
     */
    deleteSupplementaryOrder: async (id) => {
        return await sequelize.transaction(async (t) => {
            const supplementaryOrder = await SupplementaryOrder.findByPk(id, { transaction: t });
            
            if (!supplementaryOrder) {
                throw new Error('Porosia shtesë nuk u gjet!');
            }

            await supplementaryOrder.destroy({ transaction: t });
            return true;
        });
    },

    /**
     * Get supplementary order by ID
     * @param {number} id - Supplementary order ID
     * @returns {Object} - Supplementary order
     */
    getSupplementaryOrderById: async (id) => {
        const supplementaryOrder = await SupplementaryOrder.findByPk(id, {
            include: [
                {
                    model: Order,
                    as: 'ParentOrder',
                    include: [{ model: Customer }]
                }
            ]
        });

        if (!supplementaryOrder) {
            throw new Error('Porosia shtesë nuk u gjet!');
        }

        return supplementaryOrder;
    },

    // New function to handle partial payments for supplementary orders
    addPartialPaymentToSupplementaryOrder: async (id, paymentAmount, paymentReceiver = null) => {
        return await sequelize.transaction(async (t) => {
            const supplementaryOrder = await SupplementaryOrder.findByPk(id, { transaction: t });
            
            if (!supplementaryOrder) {
                throw new Error('Porosia shtesë nuk u gjet!');
            }

            // Validate payment amount
            const currentTotal = parseFloat(supplementaryOrder.cmimiTotal);
            const currentPaid = parseFloat(supplementaryOrder.kaparja);
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

            // Update supplementary order record
            await supplementaryOrder.update({
                kaparja: newTotalPaid,
                pagesaMbetur: newRemainingDebt,
                isPaymentDone: isFullyPaid,
                kaparaReceiver: paymentReceiver || supplementaryOrder.kaparaReceiver,
                statusi: supplementaryOrder.statusiProduktit  // Always use product status
            }, { transaction: t });

            return supplementaryOrder;
        });
    },

    // Cancel partial payment for supplementary order
    cancelPartialPayment: async (supplementaryOrderId, cancellationAmount) => {
        const transaction = await sequelize.transaction();
        
        try {
            // Get the supplementary order with payment info
            const supplementaryOrder = await SupplementaryOrder.findByPk(supplementaryOrderId, {
                transaction
            });

            if (!supplementaryOrder) {
                throw new Error('Porosia shtesë nuk u gjet');
            }

            const currentKaparja = parseFloat(supplementaryOrder.kaparja || 0);
            const totalAmount = parseFloat(supplementaryOrder.cmimiTotal || 0);
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

            // Update supplementary order
            await supplementaryOrder.update({
                kaparja: newKaparja.toFixed(2),
                isPaymentDone: isPaymentDone
            }, { transaction });

            // Create notification for payment cancellation
            await NotificationService.createNotification({
                type: 'supplementary_payment_cancelled',
                title: 'Pagesa e Porosisë Shtesë u Anulua',
                message: `Pagesa prej €${amountToCancel.toFixed(2)} u anulua për porosinë shtesë #${supplementaryOrderId}. Borxh i ri: €${remainingDebt.toFixed(2)}`,
                orderId: supplementaryOrder.parentOrderId,
                metadata: {
                    supplementaryOrderId: supplementaryOrderId,
                    cancelledAmount: amountToCancel,
                    newKaparja: newKaparja,
                    newDebt: remainingDebt,
                    customerName: `${supplementaryOrder.emriKlientit} ${supplementaryOrder.mbiemriKlientit}`
                }
            }, transaction);

            await transaction.commit();

            // Return updated supplementary order
            const updatedOrder = await SupplementaryOrder.findByPk(supplementaryOrderId);

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
            console.error('Error cancelling supplementary order partial payment:', error);
            throw error;
        }
    }
};

module.exports = {
    createSupplementaryOrder: supplementaryOrderService.createSupplementaryOrder,
    getSupplementaryOrdersByParentId: supplementaryOrderService.getSupplementaryOrdersByParentId,
    updateSupplementaryOrderPaymentStatus: supplementaryOrderService.updateSupplementaryOrderPaymentStatus,
    deleteSupplementaryOrder: supplementaryOrderService.deleteSupplementaryOrder,
    addPartialPayment: supplementaryOrderService.addPartialPaymentToSupplementaryOrder,
    cancelPartialPayment: supplementaryOrderService.cancelPartialPayment
}; 