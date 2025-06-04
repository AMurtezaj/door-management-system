const { sequelize } = require('./src/config/database');

async function removeKaVuleColumn() {
    try {
        console.log('🔄 Starting migration to remove kaVule column...');

        // Remove kaVule column from OrderDetails table
        await sequelize.query(`
            ALTER TABLE "OrderDetails" 
            DROP COLUMN IF EXISTS "kaVule";
        `);
        console.log('✅ Removed kaVule column from OrderDetails table');

        console.log('🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run the migration
removeKaVuleColumn()
    .then(() => {
        console.log('Migration finished. kaVule column has been removed from the database.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    }); 