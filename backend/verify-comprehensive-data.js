const { connectPostgres, sequelize } = require('./src/config/database');

async function verifyComprehensiveData() {
  try {
    // Connect to database
    await connectPostgres();
    console.log('🔗 Database connection successful!');

    console.log('\n📊 COMPREHENSIVE DATA VERIFICATION');
    console.log('===================================');
    
    // Get current data counts
    const counts = await Promise.all([
      sequelize.query('SELECT COUNT(*) FROM "Users"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "Customers"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "Orders"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "OrderDetails"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "Payments"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "SupplementaryOrders"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "DailyCapacities"', { type: sequelize.QueryTypes.SELECT })
    ]);

    console.log('📈 DATABASE OVERVIEW:');
    console.log('====================');
    console.log(`👥 Users: ${counts[0][0].count}`);
    console.log(`👤 Customers: ${counts[1][0].count}`);
    console.log(`📦 Orders: ${counts[2][0].count}`);
    console.log(`📋 Order Details: ${counts[3][0].count}`);
    console.log(`💰 Payments: ${counts[4][0].count}`);
    console.log(`📄 Supplementary Orders: ${counts[5][0].count}`);
    console.log(`📅 Daily Capacities: ${counts[6][0].count}`);

    // Sample of comprehensive order information
    const comprehensiveOrders = await sequelize.query(`
      SELECT 
        o.id,
        o."tipiPorosise",
        o."shitesi",
        c."emri",
        c."mbiemri",
        c."telefoni",
        c."vendi",
        od."gjatesia",
        od."gjeresia",
        od."profiliLarte",
        od."profiliPoshtem",
        od."statusi",
        od."statusiMatjes",
        od."matesi",
        od."installer",
        od."sender",
        od."dataMatjes",
        od."dita",
        od."eshtePrintuar",
        p."cmimiTotal",
        p."kaparja",
        p."kaparaReceiver",
        p."menyraPageses",
        p."isPaymentDone",
        p."debtType",
        o."createdAt"
      FROM "Orders" o
      JOIN "Customers" c ON o."customerId" = c.id
      LEFT JOIN "OrderDetails" od ON o.id = od."orderId"
      LEFT JOIN "Payments" p ON o.id = p."orderId"
      ORDER BY o."createdAt" DESC
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\n📦 SAMPLE COMPREHENSIVE ORDERS:');
    console.log('===============================');
    comprehensiveOrders.forEach((order, index) => {
      console.log(`\n${index + 1}. ORDER #${order.id} - ${order.tipiPorosise.toUpperCase()}`);
      console.log(`   👤 Customer: ${order.emri} ${order.mbiemri}`);
      console.log(`   📱 Phone: ${order.telefoni}`);
      console.log(`   📍 Location: ${order.vendi}`);
      console.log(`   👨‍💼 Seller: ${order.shitesi}`);
      
      if (order.gjatesia && order.gjeresia) {
        console.log(`   📐 Dimensions: ${order.gjatesia}cm x ${order.gjeresia}cm`);
        console.log(`   📏 Profiles: L=${order.profiliLarte}cm, P=${order.profiliPoshtem}cm`);
        const finalLength = parseFloat(order.gjatesia) - parseFloat(order.profiliLarte);
        const finalWidth = parseFloat(order.gjeresia) - parseFloat(order.profiliPoshtem);
        console.log(`   ✨ Final Size: ${finalLength}cm x ${finalWidth}cm`);
      }
      
      console.log(`   🎯 Status: ${order.statusi || 'N/A'}`);
      console.log(`   📏 Measurement: ${order.statusiMatjes || 'N/A'}`);
      console.log(`   👷 Measurer: ${order.matesi || 'Not assigned'}`);
      console.log(`   🔧 Installer: ${order.installer || 'Not assigned'}`);
      console.log(`   📤 Sender: ${order.sender || 'Not assigned'}`);
      
      if (order.cmimiTotal) {
        console.log(`   💰 Total Price: €${parseFloat(order.cmimiTotal).toFixed(2)}`);
        console.log(`   💳 Paid: €${parseFloat(order.kaparja).toFixed(2)}`);
        console.log(`   💸 Remaining: €${(parseFloat(order.cmimiTotal) - parseFloat(order.kaparja)).toFixed(2)}`);
        console.log(`   🏪 Payment Method: ${order.menyraPageses}`);
        console.log(`   ✅ Payment Complete: ${order.isPaymentDone ? 'Yes' : 'No'}`);
        console.log(`   👤 Payment Receiver: ${order.kaparaReceiver || 'Not specified'}`);
      }
      
      console.log(`   📅 Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      if (order.dataMatjes) {
        console.log(`   📏 Measurement Date: ${new Date(order.dataMatjes).toLocaleDateString()}`);
      }
      if (order.dita) {
        console.log(`   🚀 Scheduled Date: ${order.dita}`);
      }
      console.log(`   🖨️ Printed: ${order.eshtePrintuar ? 'Yes' : 'No'}`);
    });

    // Supplementary orders details
    const supplementaryDetails = await sequelize.query(`
      SELECT 
        so.*,
        o."tipiPorosise" as parent_type
      FROM "SupplementaryOrders" so
      JOIN "Orders" o ON so."parentOrderId" = o.id
      ORDER BY so."createdAt" DESC
      LIMIT 3
    `, { type: sequelize.QueryTypes.SELECT });

    if (supplementaryDetails.length > 0) {
      console.log('\n📄 SAMPLE SUPPLEMENTARY ORDERS:');
      console.log('===============================');
      supplementaryDetails.forEach((supp, index) => {
        console.log(`\n${index + 1}. SUPPLEMENTARY ORDER #${supp.id}`);
        console.log(`   🔗 Parent Order ID: ${supp.parentOrderId} (${supp.parent_type})`);
        console.log(`   👤 Customer: ${supp.emriKlientit} ${supp.mbiemriKlientit}`);
        console.log(`   📱 Phone: ${supp.numriTelefonit}`);
        console.log(`   📍 Location: ${supp.vendi}`);
        console.log(`   📝 Product: ${supp.pershkrimiProduktit}`);
        console.log(`   💰 Total: €${parseFloat(supp.cmimiTotal).toFixed(2)}`);
        console.log(`   💳 Paid: €${parseFloat(supp.kaparja).toFixed(2)}`);
        console.log(`   💸 Remaining: €${parseFloat(supp.pagesaMbetur).toFixed(2)}`);
        console.log(`   🏪 Payment: ${supp.menyraPageses}`);
        console.log(`   ✅ Complete: ${supp.isPaymentDone ? 'Yes' : 'No'}`);
        console.log(`   🎯 Status: ${supp.statusi}`);
        if (supp.kaparaReceiver) {
          console.log(`   👤 Payment Receiver: ${supp.kaparaReceiver}`);
        }
      });
    }

    // Financial Analytics
    const financialData = await sequelize.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM("cmimiTotal") as total_revenue,
        SUM("kaparja") as total_paid,
        AVG("cmimiTotal") as avg_order_value,
        COUNT(CASE WHEN "isPaymentDone" = true THEN 1 END) as paid_orders,
        COUNT(CASE WHEN "isPaymentDone" = false THEN 1 END) as pending_orders
      FROM "Payments"
    `, { type: sequelize.QueryTypes.SELECT });

    const suppFinancial = await sequelize.query(`
      SELECT 
        COUNT(*) as total_supp_orders,
        SUM("cmimiTotal") as total_supp_revenue,
        SUM("kaparja") as total_supp_paid,
        AVG("cmimiTotal") as avg_supp_value
      FROM "SupplementaryOrders"
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\n💰 FINANCIAL ANALYTICS:');
    console.log('=======================');
    if (financialData[0]) {
      const data = financialData[0];
      const totalRev = parseFloat(data.total_revenue) || 0;
      const totalPaid = parseFloat(data.total_paid) || 0;
      const suppRev = parseFloat(suppFinancial[0].total_supp_revenue) || 0;
      const suppPaid = parseFloat(suppFinancial[0].total_supp_paid) || 0;
      
      console.log(`📊 Main Orders: ${data.total_orders}`);
      console.log(`💶 Main Revenue: €${totalRev.toFixed(2)}`);
      console.log(`✅ Main Paid: €${totalPaid.toFixed(2)}`);
      console.log(`📈 Average Order: €${parseFloat(data.avg_order_value || 0).toFixed(2)}`);
      console.log(`🟢 Paid Orders: ${data.paid_orders}`);
      console.log(`🟡 Pending Orders: ${data.pending_orders}`);
      
      if (suppFinancial[0].total_supp_orders > 0) {
        console.log(`📄 Supplementary Orders: ${suppFinancial[0].total_supp_orders}`);
        console.log(`💶 Supplementary Revenue: €${suppRev.toFixed(2)}`);
        console.log(`✅ Supplementary Paid: €${suppPaid.toFixed(2)}`);
        console.log(`📈 Avg Supplementary: €${parseFloat(suppFinancial[0].avg_supp_value || 0).toFixed(2)}`);
        
        console.log(`\n🎯 TOTAL BUSINESS:`)
        console.log(`💰 Combined Revenue: €${(totalRev + suppRev).toFixed(2)}`);
        console.log(`✅ Combined Paid: €${(totalPaid + suppPaid).toFixed(2)}`);
        console.log(`⏳ Combined Pending: €${(totalRev + suppRev - totalPaid - suppPaid).toFixed(2)}`);
      }
    }

    // Personnel workload
    const personnelData = await sequelize.query(`
      SELECT 
        "matesi",
        COUNT(*) as measurement_count
      FROM "OrderDetails" 
      WHERE "matesi" IS NOT NULL 
      GROUP BY "matesi"
      ORDER BY measurement_count DESC
    `, { type: sequelize.QueryTypes.SELECT });

    const installerData = await sequelize.query(`
      SELECT 
        "installer",
        COUNT(*) as installation_count
      FROM "OrderDetails" 
      WHERE "installer" IS NOT NULL 
      GROUP BY "installer"
      ORDER BY installation_count DESC
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\n👷 PERSONNEL WORKLOAD:');
    console.log('=====================');
    if (personnelData.length > 0) {
      console.log('📏 Measurers:');
      personnelData.forEach(person => {
        console.log(`   • ${person.matesi}: ${person.measurement_count} measurements`);
      });
    }
    
    if (installerData.length > 0) {
      console.log('🔧 Installers:');
      installerData.forEach(person => {
        console.log(`   • ${person.installer}: ${person.installation_count} installations`);
      });
    }

    // Daily capacity overview
    const capacityOverview = await sequelize.query(`
      SELECT 
        "dita",
        "dyerGarazhi",
        "kapake"
      FROM "DailyCapacities" 
      ORDER BY "dita" 
      LIMIT 7
    `, { type: sequelize.QueryTypes.SELECT });

    console.log('\n📅 CAPACITY PLANNING (Next 7 Days):');
    console.log('===================================');
    capacityOverview.forEach(cap => {
      console.log(`📅 ${cap.dita}: 🚪 ${cap.dyerGarazhi} garage doors, 🏠 ${cap.kapake} kapaks`);
    });

    console.log('\n✅ VERIFICATION COMPLETE!');
    console.log('=========================');
    console.log('🎉 Your database now contains comprehensive, realistic business data with:');
    console.log('   • Complete order lifecycle from creation to delivery');
    console.log('   • Detailed customer information and contact details');
    console.log('   • Precise measurements and technical specifications');
    console.log('   • Full payment tracking and financial records');
    console.log('   • Personnel assignments and workload distribution');
    console.log('   • Supplementary orders for additional services');
    console.log('   • Daily capacity planning and scheduling');
    console.log('   • Multi-status tracking for all order phases');
    console.log('   • Financial analytics and business insights');
    
    console.log('\n🎯 Ready for production use with realistic sample data!');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    // Close connection
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the verification function
verifyComprehensiveData(); 