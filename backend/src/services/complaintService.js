const { Complaint } = require('../models');

// Get all complaints
const getAllComplaints = async () => {
  try {
    console.log('Getting all complaints...');
    
    const complaints = await Complaint.findAll({
      order: [
        ['statusi', 'ASC'], // Pending first
        ['createdAt', 'DESC'] // Newest first within status
      ]
    });

    console.log(`Found ${complaints.length} complaints`);
    return complaints;
  } catch (error) {
    console.error('Error getting complaints:', error);
    throw new Error(`Gabim gjatë marrjes së ankesave: ${error.message}`);
  }
};

// Get complaints by status
const getComplaintsByStatus = async (status) => {
  try {
    console.log(`Getting complaints with status: ${status}`);
    
    const complaints = await Complaint.findAll({
      where: { statusi: status },
      order: [['createdAt', 'DESC']]
    });

    console.log(`Found ${complaints.length} complaints with status ${status}`);
    return complaints;
  } catch (error) {
    console.error('Error getting complaints by status:', error);
    throw new Error(`Gabim gjatë marrjes së ankesave: ${error.message}`);
  }
};

// Create a new complaint
const createComplaint = async (pershkrimi) => {
  try {
    console.log('Creating new complaint...');
    
    if (!pershkrimi || pershkrimi.trim().length === 0) {
      throw new Error('Përshkrimi i ankesës është i detyrueshëm');
    }

    const complaint = await Complaint.create({
      pershkrimi: pershkrimi.trim(),
      statusi: 'E mbetur',
      dataKrijimit: new Date()
    });

    console.log(`Created complaint with ID: ${complaint.id}`);
    return complaint;
  } catch (error) {
    console.error('Error creating complaint:', error);
    throw new Error(`Gabim gjatë krijimit të ankesës: ${error.message}`);
  }
};

// Update complaint status
const updateComplaintStatus = async (id, newStatus) => {
  try {
    console.log(`Updating complaint ${id} status to: ${newStatus}`);
    
    const validStatuses = ['E mbetur', 'E kryer'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Status i pavlefshëm. Duhet të jetë "E mbetur" ose "E kryer"');
    }

    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      throw new Error('Ankesa nuk u gjet');
    }

    complaint.statusi = newStatus;
    await complaint.save();

    console.log(`Updated complaint ${id} status successfully`);
    return complaint;
  } catch (error) {
    console.error('Error updating complaint status:', error);
    throw new Error(`Gabim gjatë përditësimit të statusit: ${error.message}`);
  }
};

// Delete complaint
const deleteComplaint = async (id) => {
  try {
    console.log(`Deleting complaint with ID: ${id}`);
    
    const complaint = await Complaint.findByPk(id);
    if (!complaint) {
      throw new Error('Ankesa nuk u gjet');
    }

    await complaint.destroy();

    console.log(`Deleted complaint ${id} successfully`);
    return { message: 'Ankesa u fshi me sukses' };
  } catch (error) {
    console.error('Error deleting complaint:', error);
    throw new Error(`Gabim gjatë fshirjes së ankesës: ${error.message}`);
  }
};

// Get complaint statistics
const getComplaintStatistics = async () => {
  try {
    console.log('Getting complaint statistics...');
    
    const [totalCount, pendingCount, resolvedCount] = await Promise.all([
      Complaint.count(),
      Complaint.count({ where: { statusi: 'E mbetur' } }),
      Complaint.count({ where: { statusi: 'E kryer' } })
    ]);

    const stats = {
      total: totalCount,
      pending: pendingCount,
      resolved: resolvedCount
    };

    console.log('Complaint statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting complaint statistics:', error);
    throw new Error(`Gabim gjatë marrjes së statistikave: ${error.message}`);
  }
};

module.exports = {
  getAllComplaints,
  getComplaintsByStatus,
  createComplaint,
  updateComplaintStatus,
  deleteComplaint,
  getComplaintStatistics
}; 