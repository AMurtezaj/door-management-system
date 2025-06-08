const express = require('express');
const router = express.Router();
const complaintService = require('../services/complaintService');
const { auth } = require('../middleware/auth');

// Get all complaints
router.get('/', auth, async (req, res) => {
  try {
    const complaints = await complaintService.getAllComplaints();
    res.json(complaints);
  } catch (error) {
    console.error('Error in GET /complaints:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get complaints by status
router.get('/status/:status', auth, async (req, res) => {
  try {
    const { status } = req.params;
    const complaints = await complaintService.getComplaintsByStatus(status);
    res.json(complaints);
  } catch (error) {
    console.error('Error in GET /complaints/status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get complaint statistics
router.get('/statistics', auth, async (req, res) => {
  try {
    const stats = await complaintService.getComplaintStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error in GET /complaints/statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new complaint
router.post('/', auth, async (req, res) => {
  try {
    const { pershkrimi } = req.body;
    
    if (!pershkrimi) {
      return res.status(400).json({ error: 'Përshkrimi i ankesës është i detyrueshëm' });
    }

    const complaint = await complaintService.createComplaint(pershkrimi);
    res.status(201).json(complaint);
  } catch (error) {
    console.error('Error in POST /complaints:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update complaint status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { statusi } = req.body;

    if (!statusi) {
      return res.status(400).json({ error: 'Statusi është i detyrueshëm' });
    }

    const complaint = await complaintService.updateComplaintStatus(parseInt(id), statusi);
    res.json(complaint);
  } catch (error) {
    console.error('Error in PATCH /complaints/:id/status:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete complaint
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await complaintService.deleteComplaint(parseInt(id));
    res.json(result);
  } catch (error) {
    console.error('Error in DELETE /complaints/:id:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 