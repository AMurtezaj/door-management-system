require('dotenv').config();
const { connectPostgres, sequelize } = require('./src/config/database');
const User = require('./src/models/User');

async function createAdminUser() {
  try {
    // Connect to database
    await connectPostgres();
    console.log('Database connection successful!');
    
    // Check if admin already exists
    const adminExists = await User.findOne({ where: { roli: 'admin' } });
    if (adminExists) {
      console.log('An admin user already exists:', adminExists.email);
      await sequelize.close();
      return;
    }
    
    // Create admin user
    const admin = await User.create({
      emri: 'Admin',
      mbiemri: 'User',
      email: 'admin@lindidoors.com',
      password: 'admin123', // This will be hashed by the User model hooks
      roli: 'admin'
    });
    
    console.log('Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: admin123');
    
    // Close connection
    await sequelize.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Run the function
createAdminUser(); 