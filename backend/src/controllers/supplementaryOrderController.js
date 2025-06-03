const supplementaryOrderService = require('../services/supplementaryOrderService');

const supplementaryOrderController = {
    // Create new supplementary order
    createSupplementaryOrder: async (req, res) => {
        try {
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
            } = req.body;

            // Validate required fields
            const requiredFields = [
                'parentOrderId', 'emriKlientit', 'mbiemriKlientit', 
                'numriTelefonit', 'vendi', 'pershkrimiProduktit', 
                'cmimiTotal', 'menyraPageses'
            ];
            
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    return res.status(400).json({ 
                        message: `Fusha ${field} është e detyrueshme!` 
                    });
                }
            }

            // Validate numeric fields
            if (isNaN(parseFloat(cmimiTotal))) {
                return res.status(400).json({ 
                    message: 'Çmimi total duhet të jetë një numër valid!' 
                });
            }
            
            if (kaparja && isNaN(parseFloat(kaparja))) {
                return res.status(400).json({ 
                    message: 'Kaparja duhet të jetë një numër valid!' 
                });
            }

            const supplementaryOrder = await supplementaryOrderService.createSupplementaryOrder(req.body);
            
            res.status(201).json({
                message: 'Porosia shtesë u krijua me sukses!',
                data: supplementaryOrder
            });
        } catch (error) {
            console.error('Error creating supplementary order:', error);
            res.status(400).json({ 
                message: error.message || 'Diçka shkoi keq gjatë krijimit të porosisë shtesë!' 
            });
        }
    },

    // Get supplementary orders by parent order ID
    getSupplementaryOrdersByParentId: async (req, res) => {
        try {
            const { parentOrderId } = req.params;
            
            if (!parentOrderId || isNaN(parseInt(parentOrderId))) {
                return res.status(400).json({ 
                    message: 'ID e porosisë kryesore është e detyrueshme dhe duhet të jetë një numër!' 
                });
            }

            const supplementaryOrders = await supplementaryOrderService.getSupplementaryOrdersByParentId(parentOrderId);
            
            res.json({
                message: 'Porositë shtesë u morën me sukses!',
                data: supplementaryOrders
            });
        } catch (error) {
            console.error('Error fetching supplementary orders:', error);
            res.status(400).json({ 
                message: error.message || 'Diçka shkoi keq gjatë marrjes së porosive shtesë!' 
            });
        }
    },

    // Get supplementary order by ID
    getSupplementaryOrderById: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ 
                    message: 'ID e porosisë shtesë është e detyrueshme dhe duhet të jetë një numër!' 
                });
            }

            const supplementaryOrder = await supplementaryOrderService.getSupplementaryOrderById(id);
            
            res.json({
                message: 'Porosia shtesë u mor me sukses!',
                data: supplementaryOrder
            });
        } catch (error) {
            console.error('Error fetching supplementary order:', error);
            res.status(404).json({ 
                message: error.message || 'Porosia shtesë nuk u gjet!' 
            });
        }
    },

    // Update supplementary order
    updateSupplementaryOrder: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ 
                    message: 'ID e porosisë shtesë është e detyrueshme dhe duhet të jetë një numër!' 
                });
            }

            // Validate numeric fields if provided
            if (req.body.cmimiTotal && isNaN(parseFloat(req.body.cmimiTotal))) {
                return res.status(400).json({ 
                    message: 'Çmimi total duhet të jetë një numër valid!' 
                });
            }
            
            if (req.body.kaparja && isNaN(parseFloat(req.body.kaparja))) {
                return res.status(400).json({ 
                    message: 'Kaparja duhet të jetë një numër valid!' 
                });
            }

            const supplementaryOrder = await supplementaryOrderService.updateSupplementaryOrder(id, req.body);
            
            res.json({
                message: 'Porosia shtesë u përditësua me sukses!',
                data: supplementaryOrder
            });
        } catch (error) {
            console.error('Error updating supplementary order:', error);
            res.status(400).json({ 
                message: error.message || 'Diçka shkoi keq gjatë përditësimit të porosisë shtesë!' 
            });
        }
    },

    // Update payment status
    updateSupplementaryOrderPaymentStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { isPaymentDone } = req.body;
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ 
                    message: 'ID e porosisë shtesë është e detyrueshme dhe duhet të jetë një numër!' 
                });
            }

            if (typeof isPaymentDone !== 'boolean') {
                return res.status(400).json({ 
                    message: 'Statusi i pagesës duhet të jetë true ose false!' 
                });
            }

            const supplementaryOrder = await supplementaryOrderService.updateSupplementaryOrderPaymentStatus(id, isPaymentDone);
            
            res.json({
                message: 'Statusi i pagesës u përditësua me sukses!',
                data: supplementaryOrder
            });
        } catch (error) {
            console.error('Error updating supplementary order payment status:', error);
            res.status(400).json({ 
                message: error.message || 'Diçka shkoi keq gjatë përditësimit të statusit të pagesës!' 
            });
        }
    },

    // Add partial payment to supplementary order
    addPartialPaymentToSupplementaryOrder: async (req, res) => {
        try {
            const { id } = req.params;
            const { paymentAmount, paymentReceiver } = req.body;
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ 
                    message: 'ID e porosisë shtesë është e detyrueshme dhe duhet të jetë një numër!' 
                });
            }

            if (!paymentAmount) {
                return res.status(400).json({ 
                    message: 'Shuma e pagesës është e detyrueshme!' 
                });
            }

            const supplementaryOrder = await supplementaryOrderService.addPartialPaymentToSupplementaryOrder(id, paymentAmount, paymentReceiver);
            
            res.json({
                message: `Pagesa prej €${parseFloat(paymentAmount).toFixed(2)} u regjistrua me sukses për porosinë shtesë!`,
                data: supplementaryOrder
            });
        } catch (error) {
            console.error('Error adding partial payment to supplementary order:', error);
            res.status(400).json({ 
                message: error.message || 'Diçka shkoi keq gjatë regjistrimit të pagesës!' 
            });
        }
    },

    // Update product status
    updateSupplementaryOrderProductStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { statusiProduktit } = req.body;
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ 
                    message: 'ID e porosisë shtesë është e detyrueshme dhe duhet të jetë një numër!' 
                });
            }

            if (!statusiProduktit || !['në proces', 'e përfunduar'].includes(statusiProduktit)) {
                return res.status(400).json({ 
                    message: 'Statusi i produktit duhet të jetë "në proces" ose "e përfunduar"' 
                });
            }

            const supplementaryOrder = await supplementaryOrderService.updateSupplementaryOrderProductStatus(id, statusiProduktit);
            
            res.json({
                message: 'Statusi i produktit u përditësua me sukses!',
                data: supplementaryOrder
            });
        } catch (error) {
            console.error('Error updating supplementary order product status:', error);
            res.status(400).json({ 
                message: error.message || 'Diçka shkoi keq gjatë përditësimit të statusit të produktit!' 
            });
        }
    },

    // Delete supplementary order
    deleteSupplementaryOrder: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({ 
                    message: 'ID e porosisë shtesë është e detyrueshme dhe duhet të jetë një numër!' 
                });
            }

            await supplementaryOrderService.deleteSupplementaryOrder(id);
            
            res.json({
                message: 'Porosia shtesë u fshi me sukses!'
            });
        } catch (error) {
            console.error('Error deleting supplementary order:', error);
            res.status(400).json({ 
                message: error.message || 'Diçka shkoi keq gjatë fshirjes së porosisë shtesë!' 
            });
        }
    }
};

module.exports = supplementaryOrderController; 