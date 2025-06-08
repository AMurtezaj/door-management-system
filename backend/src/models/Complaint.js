const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Complaint = sequelize.define('Complaint', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    pershkrimi: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Përshkrimi i ankesës'
    },
    statusi: {
      type: DataTypes.ENUM('E mbetur', 'E kryer'),
      allowNull: false,
      defaultValue: 'E mbetur',
      comment: 'Statusi i ankesës: E mbetur (Pending) ose E kryer (Resolved)'
    },
    dataKrijimit: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Data kur është krijuar ankesa'
    }
  }, {
    tableName: 'complaints',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  return Complaint;
}; 