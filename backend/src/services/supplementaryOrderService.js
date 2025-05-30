const { sequelize, Order, Customer, SupplementaryOrder } = require('../models');

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

            // Calculate remaining payment
            const kaparjaAmount = parseFloat(kaparja || 0);
            const totalAmount = parseFloat(cmimiTotal);
            const pagesaMbetur = totalAmount - kaparjaAmount;

            // Determine status based on payment
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
                cmimiTotal: totalAmount,
                kaparja: kaparjaAmount,
                kaparaReceiver,
                pagesaMbetur,
                menyraPageses,
                isPaymentDone: isPaymentDone || false,
                statusi
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

            if (updateData.cmimiTotal !== undefined || updateData.kaparja !== undefined) {
                const newTotal = updateData.cmimiTotal !== undefined ? parseFloat(updateData.cmimiTotal) : parseFloat(supplementaryOrder.cmimiTotal);
                const newKaparja = updateData.kaparja !== undefined ? parseFloat(updateData.kaparja) : parseFloat(supplementaryOrder.kaparja);
                pagesaMbetur = newTotal - newKaparja;
                updateData.pagesaMbetur = pagesaMbetur;
            }

            // Update status based on payment
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

            let statusi = 'në proces';
            if (isPaymentDone || supplementaryOrder.pagesaMbetur <= 0) {
                statusi = 'e përfunduar';
            } else if (supplementaryOrder.pagesaMbetur > 0) {
                statusi = 'borxh';
            }

            await supplementaryOrder.update({
                isPaymentDone,
                statusi
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
    }
};

module.exports = supplementaryOrderService; 