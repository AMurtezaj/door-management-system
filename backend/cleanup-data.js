const { connectPostgres, sequelize } = require('./src/config/database');

async function cleanupData() {
  try {
    // Connect to database
    await connectPostgres();
    console.log('🔗 Database connection successful!');

    // Get current data counts before cleanup
    console.log('\n📊 BEFORE CLEANUP:');
    console.log('==================');
    
    const beforeCounts = await Promise.all([
      sequelize.query('SELECT COUNT(*) FROM "Users"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "Customers"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "Orders"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "Payments"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "OrderDetails"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "SupplementaryOrders"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "DailyCapacities"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "Notifications"', { type: sequelize.QueryTypes.SELECT })
    ]);

    console.log(`👥 Users: ${beforeCounts[0][0].count}`);
    console.log(`👤 Customers: ${beforeCounts[1][0].count}`);
    console.log(`📦 Orders: ${beforeCounts[2][0].count}`);
    console.log(`💰 Payments: ${beforeCounts[3][0].count}`);
    console.log(`📋 Order Details: ${beforeCounts[4][0].count}`);
    console.log(`📄 Supplementary Orders: ${beforeCounts[5][0].count}`);
    console.log(`📅 Daily Capacities: ${beforeCounts[6][0].count}`);
    console.log(`🔔 Notifications: ${beforeCounts[7][0].count}`);

    console.log('\n🗑️  Starting cleanup process...');
    console.log('⚠️  This will delete ALL data except the admin user!');

    // Start transaction for safety
    const transaction = await sequelize.transaction();

    try {
      // Delete data in correct order (respecting foreign key constraints)
      console.log('🔄 Deleting Notifications...');
      await sequelize.query('DELETE FROM "Notifications"', { transaction });

      console.log('🔄 Deleting Supplementary Orders...');
      await sequelize.query('DELETE FROM "SupplementaryOrders"', { transaction });

      console.log('🔄 Deleting Payments...');
      await sequelize.query('DELETE FROM "Payments"', { transaction });

      console.log('🔄 Deleting Order Details...');
      await sequelize.query('DELETE FROM "OrderDetails"', { transaction });

      console.log('🔄 Deleting Orders...');
      await sequelize.query('DELETE FROM "Orders"', { transaction });

      console.log('🔄 Deleting Customers...');
      await sequelize.query('DELETE FROM "Customers"', { transaction });

      console.log('🔄 Deleting Daily Capacities...');
      await sequelize.query('DELETE FROM "DailyCapacities"', { transaction });

      console.log('🔄 Deleting Users (except admin)...');
      await sequelize.query('DELETE FROM "Users" WHERE "roli" != \'admin\'', { transaction });

      // Reset sequences to start from 1
      console.log('🔄 Resetting ID sequences...');
      await sequelize.query('ALTER SEQUENCE "Users_id_seq" RESTART WITH 1', { transaction });
      await sequelize.query('ALTER SEQUENCE "Customers_id_seq" RESTART WITH 1', { transaction });
      await sequelize.query('ALTER SEQUENCE "Orders_id_seq" RESTART WITH 1', { transaction });
      await sequelize.query('ALTER SEQUENCE "Payments_id_seq" RESTART WITH 1', { transaction });
      await sequelize.query('ALTER SEQUENCE "OrderDetails_id_seq" RESTART WITH 1', { transaction });
      await sequelize.query('ALTER SEQUENCE "SupplementaryOrders_id_seq" RESTART WITH 1', { transaction });
      await sequelize.query('ALTER SEQUENCE "Notifications_id_seq" RESTART WITH 1', { transaction });

      // Update admin user IDs if needed
      const adminUsers = await sequelize.query(
        'SELECT id FROM "Users" WHERE "roli" = \'admin\' ORDER BY id',
        { type: sequelize.QueryTypes.SELECT, transaction }
      );

      if (adminUsers.length > 0) {
        // Update first admin to have ID 1
        await sequelize.query(
          'UPDATE "Users" SET id = 1 WHERE id = :oldId',
          { 
            replacements: { oldId: adminUsers[0].id },
            transaction 
          }
        );
        
        // Update sequence to continue from 2
        await sequelize.query('ALTER SEQUENCE "Users_id_seq" RESTART WITH 2', { transaction });
      }

      // Commit transaction
      await transaction.commit();
      console.log('✅ All data deleted successfully!');

    } catch (error) {
      // Rollback on error
      await transaction.rollback();
      throw error;
    }

    // Get final counts after cleanup
    console.log('\n📊 AFTER CLEANUP:');
    console.log('=================');
    
    const afterCounts = await Promise.all([
      sequelize.query('SELECT COUNT(*) FROM "Users"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "Customers"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "Orders"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "Payments"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "OrderDetails"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "SupplementaryOrders"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "DailyCapacities"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "Notifications"', { type: sequelize.QueryTypes.SELECT })
    ]);

    console.log(`👥 Users: ${afterCounts[0][0].count}`);
    console.log(`👤 Customers: ${afterCounts[1][0].count}`);
    console.log(`📦 Orders: ${afterCounts[2][0].count}`);
    console.log(`💰 Payments: ${afterCounts[3][0].count}`);
    console.log(`📋 Order Details: ${afterCounts[4][0].count}`);
    console.log(`📄 Supplementary Orders: ${afterCounts[5][0].count}`);
    console.log(`📅 Daily Capacities: ${afterCounts[6][0].count}`);
    console.log(`🔔 Notifications: ${afterCounts[7][0].count}`);

    // Show remaining admin users
    const remainingAdmins = await sequelize.query(
      'SELECT "emri", "mbiemri", "email" FROM "Users" WHERE "roli" = \'admin\'',
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('\n👑 REMAINING ADMIN USERS:');
    console.log('========================');
    remainingAdmins.forEach(admin => {
      console.log(`  • ${admin.emri} ${admin.mbiemri} (${admin.email})`);
    });

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('💡 Your database is now clean and ready for fresh data.');
    console.log('🔑 Admin users have been preserved for system access.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    // Close connection
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the cleanup function
cleanupData(); 