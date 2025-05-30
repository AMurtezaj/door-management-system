const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'door_management',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  try {
    console.log('🔄 Running SupplementaryOrders migration...');
    
    const migrationPath = path.join(__dirname, 'src', 'migrations', 'add_supplementary_orders.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Remove the PRINT statement as it's not valid in PostgreSQL
    const cleanSQL = migrationSQL.replace(/PRINT .+;/g, '');
    
    await pool.query(cleanSQL);
    console.log('✅ SupplementaryOrders table created successfully!');
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration(); 