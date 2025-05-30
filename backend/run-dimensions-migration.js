const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'root',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'door_management',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

async function runDimensionsMigration() {
  try {
    console.log('🔄 Running Dimensions migration...');
    console.log('📋 Adding gjatesia, gjeresia, profiliLarte, and profiliPoshtem fields to OrderDetails table...');
    
    // Test database connection first
    console.log('🔗 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful!');
    
    const migrationPath = path.join(__dirname, 'src', 'migrations', 'add_dimensions_to_order_details.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    console.log('✅ Dimension fields added successfully!');
    console.log('📊 New fields added:');
    console.log('   - gjatesia (DECIMAL): Input length value');
    console.log('   - gjeresia (DECIMAL): Input width value');
    console.log('   - profiliLarte (DECIMAL): Top profile value');
    console.log('   - profiliPoshtem (DECIMAL): Bottom profile value');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('🎉 Your door dimension management system is now ready!');
    console.log('📝 You can now use the new API endpoints:');
    console.log('   - PUT /api/orders/:id/dimensions - Update dimensions');
    console.log('   - GET /api/orders/:id/dimensions - Get calculations');
  } catch (error) {
    console.error('❌ Error running dimensions migration:', error.message);
    console.error('💡 Troubleshooting tips:');
    console.error('   - Make sure your database is running');
    console.error('   - Check your .env file for correct database credentials');
    console.error('   - Verify the database name exists');
    console.error('   - Ensure the user has proper permissions');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runDimensionsMigration(); 