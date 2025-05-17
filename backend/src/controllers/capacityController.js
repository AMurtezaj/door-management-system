const DailyCapacity = require('../models/DailyCapacity');

const capacityController = {
    // Set daily capacity
    // setCapacity: async (req, res) => {
    //     try {
    //         const { dita, dyerGarazhi, kapake } = req.body;

    //         const existingCapacity = await DailyCapacity.findOne({ where: { dita } });
    //         if (existingCapacity) {
    //             await existingCapacity.update({ dyerGarazhi, kapake });
    //             return res.json(existingCapacity);
    //         }

    //         const capacity = await DailyCapacity.create({
    //             dita,
    //             dyerGarazhi,
    //             kapake
    //         });

    //         res.status(201).json(capacity);
    //     } catch (error) {
    //         res.status(400).json({ message: 'Diçka shkoi keq!' });
    //     }
    // },
    setCapacity: async (req, res) => {
        try {
            const { dita, dyerGarazhi, kapake } = req.body;

            // Format dita to DATEONLY (YYYY-MM-DD)
            const formattedDita = dita ? new Date(dita).toISOString().split('T')[0] : null;
            if (!formattedDita) {
                return res.status(400).json({ message: 'Dita është e detyrueshme!' });
            }

            const existingCapacity = await DailyCapacity.findOne({ where: { dita: formattedDita } });
            if (existingCapacity) {
                await existingCapacity.update({ dyerGarazhi, kapake });
                return res.json(existingCapacity);
            }

            const capacity = await DailyCapacity.create({
                dita: formattedDita,
                dyerGarazhi,
                kapake
            });

            res.status(201).json(capacity);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!', error: error.message });
        }
    },

    getCapacityByDay: async (req, res) => {
        try {
            const formattedDita = req.params.dita ? new Date(req.params.dita).toISOString().split('T')[0] : null;
            if (!formattedDita) {
                return res.status(400).json({ message: 'Dita është e detyrueshme!' });
            }

            const capacity = await DailyCapacity.findOne({
                where: { dita: formattedDita }
            });
            if (!capacity) {
                return res.status(404).json({ message: 'Kapaciteti për këtë ditë nuk u gjet!' });
            }
            res.json(capacity);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!', error: error.message });
        }
    },

    // Get all daily capacities
    getAllCapacities: async (req, res) => {
        try {
            const capacities = await DailyCapacity.findAll();
            res.json(capacities);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

    // Get capacity by day
    // getCapacityByDay: async (req, res) => {
    //     try {
    //         const capacity = await DailyCapacity.findOne({
    //             where: { dita: req.params.dita }
    //         });
    //         if (!capacity) {
    //             return res.status(404).json({ message: 'Kapaciteti për këtë ditë nuk u gjet!' });
    //         }
    //         res.json(capacity);
    //     } catch (error) {
    //         res.status(400).json({ message: 'Diçka shkoi keq!' });
    //     }
    // },

    // Update capacity
    updateCapacity: async (req, res) => {
        try {
            const capacity = await DailyCapacity.findByPk(req.params.id);
            if (!capacity) {
                return res.status(404).json({ message: 'Kapaciteti nuk u gjet!' });
            }

            await capacity.update(req.body);
            res.json(capacity);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },
    
    // Delete capacity
    deleteCapacity: async (req, res) => {
        try {
            const capacity = await DailyCapacity.findByPk(req.params.id);
            if (!capacity) {
                return res.status(404).json({ message: 'Kapaciteti nuk u gjet!' });
            }

            await capacity.destroy();
            res.json({ message: 'Kapaciteti u fshi me sukses!' });
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq gjatë fshirjes së kapacitetit!' });
        }
    }
};

module.exports = capacityController; 