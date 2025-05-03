const DailyCapacity = require('../models/DailyCapacity');

const capacityController = {
    // Set daily capacity
    setCapacity: async (req, res) => {
        try {
            const { dita, dyerGarazhi, kapake } = req.body;

            const existingCapacity = await DailyCapacity.findOne({ where: { dita } });
            if (existingCapacity) {
                await existingCapacity.update({ dyerGarazhi, kapake });
                return res.json(existingCapacity);
            }

            const capacity = await DailyCapacity.create({
                dita,
                dyerGarazhi,
                kapake
            });

            res.status(201).json(capacity);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
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
    getCapacityByDay: async (req, res) => {
        try {
            const capacity = await DailyCapacity.findOne({
                where: { dita: req.params.dita }
            });
            if (!capacity) {
                return res.status(404).json({ message: 'Kapaciteti për këtë ditë nuk u gjet!' });
            }
            res.json(capacity);
        } catch (error) {
            res.status(400).json({ message: 'Diçka shkoi keq!' });
        }
    },

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
    }
};

module.exports = capacityController; 