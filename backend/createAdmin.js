const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/config/database');
require('dotenv').config();

async function createAdmin() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const [admin, created] = await User.findOrCreate({
      where: { email: 'admin@admin.com' },
      defaults: {
        emri: 'Admin',
        mbiemri: 'User',
        email: 'admin@admin.com',
        password: hashedPassword,
        roli: 'admin'
      }
    });
    
    if (created) {
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }
    
    process.exit();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin(); 