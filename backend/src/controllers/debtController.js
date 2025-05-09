const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const debtController = {
    // Get all cash debts with enhanced filtering
    getCashDebts: async (req, res) => {
        try {
            const {
                startDate,
                endDate,
                minAmount,
                maxAmount,
                sortBy = 'createdAt',
                sortOrder = 'DESC',
                clientName,
                clientLastName,
                location,
                phoneNumber,
                status
            } = req.query;

            const whereClause = {
                statusi: 'borxh',
                menyraPageses: 'kesh'
            };

            // Add date filter
            if (startDate || endDate) {
                whereClause.createdAt = {};
                if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
                if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
            }

            // Add amount filter
            if (minAmount || maxAmount) {
                whereClause.pagesaMbetur = {};
                if (minAmount) whereClause.pagesaMbetur[Op.gte] = parseFloat(minAmount);
                if (maxAmount) whereClause.pagesaMbetur[Op.lte] = parseFloat(maxAmount);
            }

            // Add client name filter
            if (clientName) {
                whereClause.emriKlientit = { [Op.iLike]: `%${clientName}%` };
            }

            // Add client last name filter
            if (clientLastName) {
                whereClause.mbiemriKlientit = { [Op.iLike]: `%${clientLastName}%` };
            }

            // Add location filter
            if (location) {
                whereClause.vendi = { [Op.iLike]: `%${location}%` };
            }

            // Add phone number filter
            if (phoneNumber) {
                whereClause.numriTelefonit = { [Op.iLike]: `%${phoneNumber}%` };
            }

            // Add status filter if provided
            if (status) {
                whereClause.statusi = status;
            }

            const orders = await Order.findAll({
                where: whereClause,
                include: [{
                    model: Payment,
                    attributes: ['shuma', 'dataPageses', 'eshteKonfirmuar']
                }],
                order: [[sortBy, sortOrder]]
            });

            const debts = orders.map(order => ({
                ...order.toJSON(),
                borxhMbetur: order.pagesaMbetur,
                pagesat: order.Payments
            }));

            res.json(debts);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get all bank debts with enhanced filtering
    getBankDebts: async (req, res) => {
        try {
            const {
                startDate,
                endDate,
                minAmount,
                maxAmount,
                sortBy = 'createdAt',
                sortOrder = 'DESC',
                clientName,
                clientLastName,
                location,
                phoneNumber,
                status,
                isConfirmed
            } = req.query;

            const whereClause = {
                statusi: 'borxh',
                menyraPageses: 'banke'
            };

            // Add date filter
            if (startDate || endDate) {
                whereClause.createdAt = {};
                if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
                if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
            }

            // Add amount filter
            if (minAmount || maxAmount) {
                whereClause.pagesaMbetur = {};
                if (minAmount) whereClause.pagesaMbetur[Op.gte] = parseFloat(minAmount);
                if (maxAmount) whereClause.pagesaMbetur[Op.lte] = parseFloat(maxAmount);
            }

            // Add client name filter
            if (clientName) {
                whereClause.emriKlientit = { [Op.iLike]: `%${clientName}%` };
            }

            // Add client last name filter
            if (clientLastName) {
                whereClause.mbiemriKlientit = { [Op.iLike]: `%${clientLastName}%` };
            }

            // Add location filter
            if (location) {
                whereClause.vendi = { [Op.iLike]: `%${location}%` };
            }

            // Add phone number filter
            if (phoneNumber) {
                whereClause.numriTelefonit = { [Op.iLike]: `%${phoneNumber}%` };
            }

            // Add status filter if provided
            if (status) {
                whereClause.statusi = status;
            }

            const orders = await Order.findAll({
                where: whereClause,
                include: [{
                    model: Payment,
                    attributes: ['shuma', 'dataPageses', 'eshteKonfirmuar', 'numriTransaksionit'],
                    where: isConfirmed !== undefined ? { eshteKonfirmuar: isConfirmed === 'true' } : {}
                }],
                order: [[sortBy, sortOrder]]
            });

            const debts = orders.map(order => ({
                ...order.toJSON(),
                borxhMbetur: order.pagesaMbetur,
                pagesat: order.Payments
            }));

            res.json(debts);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Export debts to Excel
    exportDebts: async (req, res) => {
        try {
            const { type } = req.params; // 'cash' or 'bank'
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Debts');

            // Add headers
            worksheet.columns = [
                { header: 'Emri Klientit', key: 'emriKlientit', width: 20 },
                { header: 'Mbiemri Klientit', key: 'mbiemriKlientit', width: 20 },
                { header: 'Borxh Mbetur', key: 'borxhMbetur', width: 15 },
                { header: 'Data', key: 'createdAt', width: 20 },
                { header: 'Numri Telefonit', key: 'numriTelefonit', width: 15 },
                { header: 'Vendi', key: 'vendi', width: 20 }
            ];

            // Get debts based on type
            const whereClause = {
                statusi: 'borxh',
                menyraPageses: type
            };

            const orders = await Order.findAll({
                where: whereClause,
                order: [['createdAt', 'DESC']]
            });

            // Add rows
            orders.forEach(order => {
                worksheet.addRow({
                    emriKlientit: order.emriKlientit,
                    mbiemriKlientit: order.mbiemriKlientit,
                    borxhMbetur: order.pagesaMbetur,
                    createdAt: order.createdAt.toLocaleDateString(),
                    numriTelefonit: order.numriTelefonit,
                    vendi: order.vendi
                });
            });

            // Set response headers
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                `attachment; filename=${type}-debts.xlsx`
            );

            // Send the file
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get debt statistics
    getDebtStatistics: async (req, res) => {
        try {
            const { period = 'month' } = req.query;
            const now = new Date();
            let startDate;

            switch (period) {
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                default:
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
            }

            const cashDebts = await Order.findAll({
                where: {
                    statusi: 'borxh',
                    menyraPageses: 'kesh',
                    createdAt: { [Op.gte]: startDate }
                }
            });

            const bankDebts = await Order.findAll({
                where: {
                    statusi: 'borxh',
                    menyraPageses: 'banke',
                    createdAt: { [Op.gte]: startDate }
                }
            });

            const statistics = {
                totalCashDebts: cashDebts.length,
                totalBankDebts: bankDebts.length,
                totalCashAmount: cashDebts.reduce((sum, order) => sum + order.pagesaMbetur, 0),
                totalBankAmount: bankDebts.reduce((sum, order) => sum + order.pagesaMbetur, 0),
                averageCashDebt: cashDebts.length ? 
                    cashDebts.reduce((sum, order) => sum + order.pagesaMbetur, 0) / cashDebts.length : 0,
                averageBankDebt: bankDebts.length ?
                    bankDebts.reduce((sum, order) => sum + order.pagesaMbetur, 0) / bankDebts.length : 0
            };

            res.json(statistics);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get all unconfirmed bank payments
    getUnconfirmedBankPayments: async (req, res) => {
        try {
            const payments = await Payment.findAll({
                where: {
                    menyraPageses: 'banke',
                    eshteKonfirmuar: false
                },
                include: [{
                    model: Order,
                    attributes: ['emriKlientit', 'mbiemriKlientit', 'cmimiTotal', 'pagesaMbetur']
                }],
                order: [['createdAt', 'DESC']]
            });
            res.json(payments);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get debt summary
    getDebtSummary: async (req, res) => {
        try {
            const cashDebts = await Order.sum('pagesaMbetur', {
                where: {
                    statusi: 'borxh',
                    menyraPageses: 'kesh'
                }
            });

            const bankDebts = await Order.sum('pagesaMbetur', {
                where: {
                    statusi: 'borxh',
                    menyraPageses: 'banke'
                }
            });

            const unconfirmedBankPayments = await Payment.sum('shuma', {
                where: {
                    menyraPageses: 'banke',
                    eshteKonfirmuar: false
                }
            });

            res.json({
                totalCashDebt: cashDebts || 0,
                totalBankDebt: bankDebts || 0,
                unconfirmedBankPayments: unconfirmedBankPayments || 0,
                totalDebt: (cashDebts || 0) + (bankDebts || 0)
            });
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Generate debt statement PDF
    generateDebtStatement: async (req, res) => {
        try {
            const { orderId } = req.params;
            const order = await Order.findByPk(orderId, {
                include: [{
                    model: Payment,
                    attributes: ['shuma', 'dataPageses', 'eshteKonfirmuar', 'numriTransaksionit']
                }]
            });

            if (!order) {
                return res.status(404).json({ message: 'Porosia nuk u gjet!' });
            }

            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=debt-statement-${orderId}.pdf`);

            // Pipe PDF to response
            doc.pipe(res);

            // Add company header
            doc.fontSize(20)
               .text('DEKLARATA E BORXHIT', { align: 'center' })
               .moveDown();

            // Add company details
            doc.fontSize(12)
               .text('Kompania: Dyer Garazhi')
               .text('Adresa: [Adresa e Kompanisë]')
               .text('Tel: [Numri i Telefonit]')
               .moveDown();

            // Add client details
            doc.fontSize(14)
               .text('TË DHËNAT E KLIENTIT', { underline: true })
               .moveDown();

            doc.fontSize(12)
               .text(`Emri: ${order.emriKlientit} ${order.mbiemriKlientit}`)
               .text(`Adresa: ${order.vendi}`)
               .text(`Telefoni: ${order.numriTelefonit}`)
               .moveDown();

            // Add order details
            doc.fontSize(14)
               .text('DETAJET E POROSISË', { underline: true })
               .moveDown();

            doc.fontSize(12)
               .text(`Numri i Porosisë: ${order.id}`)
               .text(`Data e Porosisë: ${order.createdAt.toLocaleDateString()}`)
               .text(`Tipi i Porosisë: ${order.tipiPorosise}`)
               .text(`Çmimi Total: ${order.cmimiTotal}€`)
               .text(`Borxh i Mbetur: ${order.pagesaMbetur}€`)
               .moveDown();

            // Add payment history
            doc.fontSize(14)
               .text('HISTORIKU I PAGESAVE', { underline: true })
               .moveDown();

            if (order.Payments && order.Payments.length > 0) {
                order.Payments.forEach((payment, index) => {
                    doc.fontSize(12)
                       .text(`Pagesa ${index + 1}:`)
                       .text(`Shuma: ${payment.shuma}€`)
                       .text(`Data: ${payment.dataPageses.toLocaleDateString()}`)
                       .text(`Metoda: ${payment.menyraPageses}`)
                       .text(`Konfirmuar: ${payment.eshteKonfirmuar ? 'Po' : 'Jo'}`)
                       .moveDown();
                });
            } else {
                doc.fontSize(12)
                   .text('Nuk ka pagesa të regjistruara')
                   .moveDown();
            }

            // Add footer
            doc.fontSize(10)
               .text('Ky dokument është gjeneruar automatikisht nga sistemi i menaxhimit të borxheve.', { align: 'center' })
               .text(`Data e gjenerimit: ${new Date().toLocaleDateString()}`, { align: 'center' });

            // Finalize PDF
            doc.end();
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Generate debt statements for multiple orders
    generateBulkDebtStatements: async (req, res) => {
        try {
            const { orderIds } = req.body;
            const orders = await Order.findAll({
                where: {
                    id: {
                        [Op.in]: orderIds
                    }
                },
                include: [{
                    model: Payment,
                    attributes: ['shuma', 'dataPageses', 'eshteKonfirmuar', 'numriTransaksionit']
                }]
            });

            if (!orders.length) {
                return res.status(404).json({ message: 'Nuk u gjetën porosi!' });
            }

            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=debt-statements.pdf');

            // Pipe PDF to response
            doc.pipe(res);

            // Add company header
            doc.fontSize(20)
               .text('DEKLARATA TË SHUMËFISHTA TË BORXHEVE', { align: 'center' })
               .moveDown();

            // Add company details
            doc.fontSize(12)
               .text('Kompania: Dyer Garazhi')
               .text('Adresa: [Adresa e Kompanisë]')
               .text('Tel: [Numri i Telefonit]')
               .moveDown();

            // Add each order's details
            orders.forEach((order, index) => {
                if (index > 0) {
                    doc.addPage();
                }

                doc.fontSize(14)
                   .text(`DEKLARATA ${index + 1}`, { align: 'center' })
                   .moveDown();

                // Add client details
                doc.fontSize(12)
                   .text(`Klienti: ${order.emriKlientit} ${order.mbiemriKlientit}`)
                   .text(`Adresa: ${order.vendi}`)
                   .text(`Telefoni: ${order.numriTelefonit}`)
                   .moveDown();

                // Add order details
                doc.fontSize(12)
                   .text(`Numri i Porosisë: ${order.id}`)
                   .text(`Data e Porosisë: ${order.createdAt.toLocaleDateString()}`)
                   .text(`Tipi i Porosisë: ${order.tipiPorosise}`)
                   .text(`Çmimi Total: ${order.cmimiTotal}€`)
                   .text(`Borxh i Mbetur: ${order.pagesaMbetur}€`)
                   .moveDown();

                // Add payment history
                if (order.Payments && order.Payments.length > 0) {
                    doc.text('Historiku i Pagesave:')
                       .moveDown();
                    order.Payments.forEach((payment, pIndex) => {
                        doc.text(`Pagesa ${pIndex + 1}: ${payment.shuma}€ (${payment.dataPageses.toLocaleDateString()})`)
                           .text(`Metoda: ${payment.menyraPageses}, Konfirmuar: ${payment.eshteKonfirmuar ? 'Po' : 'Jo'}`)
                           .moveDown();
                    });
                }
            });

            // Add footer
            doc.fontSize(10)
               .text('Ky dokument është gjeneruar automatikisht nga sistemi i menaxhimit të borxheve.', { align: 'center' })
               .text(`Data e gjenerimit: ${new Date().toLocaleDateString()}`, { align: 'center' });

            // Finalize PDF
            doc.end();
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    }
};

module.exports = debtController; 