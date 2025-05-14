require('dotenv').config();
const { connectPostgres, sequelize } = require('./src/config/database');
const User = require('./src/models/User');

async function createManagerUser() {
  try {
    // Connect to database
    await connectPostgres();
    console.log('Database connection successful!');
    
    // Check if user already exists
    const userExists = await User.findOne({ where: { email: 'manager@lindidoors.com' } });
    if (userExists) {
      console.log('A user with this email already exists');
      await sequelize.close();
      return;
    }
    
    // Create manager user
    const manager = await User.create({
      emri: 'Manager',
      mbiemri: 'User',
      email: 'manager@lindidoors.com',
      password: 'manager123', // This will be hashed by the User model hooks
      roli: 'menaxher'
    });
    
    console.log('Manager user created successfully!');
    console.log('Email:', manager.email);
    console.log('Password: manager123');
    
    // Close connection
    await sequelize.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error creating manager user:', error);
  }
}

// Run the function
createManagerUser(); 