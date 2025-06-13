const { connectPostgres, sequelize } = require('./src/config/database');
const Customer = require('./src/models/Customer');
const Order = require('./src/models/Order');
const OrderDetails = require('./src/models/OrderDetails');
const Payment = require('./src/models/Payment');
const SupplementaryOrder = require('./src/models/SupplementaryOrder');
const DailyCapacity = require('./src/models/DailyCapacity');

async function comprehensiveSeedData() {
  try {
    // Connect to database
    await connectPostgres();
    console.log('🔗 Database connection successful!');

    console.log('\n🌱 Starting comprehensive data seeding...');

    // Check existing data first
    const existingCounts = await Promise.all([
      sequelize.query('SELECT COUNT(*) FROM "Customers"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "Orders"', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) FROM "DailyCapacities"', { type: sequelize.QueryTypes.SELECT })
    ]);

    console.log('\n📊 EXISTING DATA CHECK:');
    console.log('=======================');
    console.log(`👤 Existing Customers: ${existingCounts[0][0].count}`);
    console.log(`📦 Existing Orders: ${existingCounts[1][0].count}`);
    console.log(`📅 Existing Capacities: ${existingCounts[2][0].count}`);

    // Sample customer data - 15 customers
    const customerData = [
      { emri: 'Agron', mbiemri: 'Krasniqi', telefoni: '+383 44 123 456', vendi: 'Prishtinë' },
      { emri: 'Fatmir', mbiemri: 'Berisha', telefoni: '+383 45 234 567', vendi: 'Prizren' },
      { emri: 'Valdrin', mbiemri: 'Mustafa', telefoni: '+383 46 345 678', vendi: 'Pejë' },
      { emri: 'Driton', mbiemri: 'Hoxha', telefoni: '+383 47 456 789', vendi: 'Gjakovë' },
      { emri: 'Blerton', mbiemri: 'Sadiku', telefoni: '+383 48 567 890', vendi: 'Mitrovicë' },
      { emri: 'Arben', mbiemri: 'Gashi', telefoni: '+383 49 678 901', vendi: 'Ferizaj' },
      { emri: 'Besnik', mbiemri: 'Rexhepi', telefoni: '+383 44 789 012', vendi: 'Gjilan' },
      { emri: 'Flamur', mbiemri: 'Zeka', telefoni: '+383 45 890 123', vendi: 'Vushtrri' },
      { emri: 'Mentor', mbiemri: 'Bytyqi', telefoni: '+383 46 901 234', vendi: 'Suharekë' },
      { emri: 'Trim', mbiemri: 'Lluka', telefoni: '+383 47 012 345', vendi: 'Malishevë' },
      { emri: 'Ermal', mbiemri: 'Shala', telefoni: '+383 48 123 456', vendi: 'Rahovec' },
      { emri: 'Fisnik', mbiemri: 'Kastrati', telefoni: '+383 49 234 567', vendi: 'Istog' },
      { emri: 'Granit', mbiemri: 'Demolli', telefoni: '+383 44 345 678', vendi: 'Klinë' },
      { emri: 'Ilir', mbiemri: 'Peci', telefoni: '+383 45 456 789', vendi: 'Skënderaj' },
      { emri: 'Kushtrim', mbiemri: 'Veseli', telefoni: '+383 46 567 890', vendi: 'Lipjan' }
    ];

    // Create customers if none exist or add to existing
    console.log('👥 Creating sample customers...');
    let customers;
    if (parseInt(existingCounts[0][0].count) === 0) {
      customers = await Customer.bulkCreate(customerData);
      console.log(`✅ Created ${customers.length} new customers`);
    } else {
      // Get existing customers and add new ones if needed
      const existingCustomers = await Customer.findAll();
      const newCustomers = customerData.filter(newCust => 
        !existingCustomers.some(existing => 
          existing.emri === newCust.emri && existing.mbiemri === newCust.mbiemri
        )
      );
      
      if (newCustomers.length > 0) {
        const createdNewCustomers = await Customer.bulkCreate(newCustomers);
        customers = [...existingCustomers, ...createdNewCustomers];
        console.log(`✅ Added ${createdNewCustomers.length} new customers to existing ${existingCustomers.length}`);
      } else {
        customers = existingCustomers;
        console.log(`✅ Using existing ${customers.length} customers`);
      }
    }

    // Handle daily capacities - add only missing dates
    console.log('📅 Managing daily capacities...');
    const existingCapacities = await sequelize.query(
      'SELECT "dita" FROM "DailyCapacities" ORDER BY "dita"',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    const existingDates = new Set(existingCapacities.map(cap => cap.dita));
    const capacityData = [];
    const startDate = new Date();
    
    // Generate 30 days of capacity data, skipping existing dates
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      if (!existingDates.has(dateString)) {
        capacityData.push({
          dita: dateString,
          dyerGarazhi: Math.floor(Math.random() * 5) + 3, // 3-7 doors per day
          kapake: Math.floor(Math.random() * 8) + 5 // 5-12 kapaks per day
        });
      }
    }

    if (capacityData.length > 0) {
      const capacities = await DailyCapacity.bulkCreate(capacityData);
      console.log(`✅ Created ${capacities.length} new daily capacity records`);
    } else {
      console.log(`✅ Using existing capacity records`);
    }

    // Order types according to existing model
    const orderTypes = ['derë garazhi', 'kapak', 'derë dhome', 'derë garazhi + kapak'];
    const sellers = ['Agron Krasniqi', 'Fatmir Berisha', 'Valdrin Mustafa', 'Driton Hoxha', 'Blerton Sadiku'];
    const measurers = ['Besnik Matesi', 'Flamur Tekniku', 'Mentor Specialist'];
    const installers = ['Trim Montues', 'Ermal Tekniku', 'Fisnik Specialist'];
    
    console.log('📦 Creating comprehensive orders...');
    
    // Create 20 orders with full information
    const orders = [];
    const orderDetails = [];
    const payments = [];
    const supplementaryOrders = [];

    for (let i = 0; i < 20; i++) {
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      const randomType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
      const randomSeller = sellers[Math.floor(Math.random() * sellers.length)];
      
      // Create order
      const orderData = {
        customerId: randomCustomer.id,
        tipiPorosise: randomType,
        shitesi: randomSeller,
        pershkrimi: `${randomType} për ${randomCustomer.emri} ${randomCustomer.mbiemri} - ${randomCustomer.vendi}. Porosi e detajuar me specifikime të plota dhe kërkesa specifike.`,
        createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000) // Random date within last 14 days
      };
      
      orders.push(orderData);
    }

    // Bulk create orders first
    const createdOrders = await Order.bulkCreate(orders);
    console.log(`✅ Created ${createdOrders.length} comprehensive orders`);

    // Create comprehensive order details for each order
    console.log('📋 Creating comprehensive order details...');
    
    for (const order of createdOrders) {
      const isGarageDoor = order.tipiPorosise === 'derë garazhi';
      const isKapak = order.tipiPorosise === 'kapak';
      const isCombined = order.tipiPorosise === 'derë garazhi + kapak';
      
      // Dimensions based on order type
      let gjatesia, gjeresia;
      if (isGarageDoor || isCombined) {
        gjatesia = Math.floor(Math.random() * 200) + 250; // 250-449 cm
        gjeresia = Math.floor(Math.random() * 100) + 200; // 200-299 cm
      } else if (isKapak) {
        gjatesia = Math.floor(Math.random() * 150) + 100; // 100-249 cm
        gjeresia = Math.floor(Math.random() * 100) + 150; // 150-249 cm
      } else { // derë dhome
        gjatesia = Math.floor(Math.random() * 50) + 200; // 200-249 cm
        gjeresia = Math.floor(Math.random() * 30) + 80; // 80-109 cm
      }

      const orderDetailData = {
        orderId: order.id,
        // Measurement information
        gjatesia: gjatesia,
        gjeresia: gjeresia,
        profiliLarte: Math.floor(Math.random() * 10) + 5, // 5-14 cm
        profiliPoshtem: Math.floor(Math.random() * 10) + 5, // 5-14 cm
        
        // Status and progress tracking
        statusi: ['në proces', 'e përfunduar', 'borxh'][Math.floor(Math.random() * 3)],
        statusiMatjes: Math.random() > 0.3 ? 'e matur' : 'e pamatur',
        eshtePrintuar: Math.random() > 0.6,
        
        // Personnel assignments
        matesi: Math.random() > 0.2 ? measurers[Math.floor(Math.random() * measurers.length)] : null,
        installer: Math.random() > 0.3 ? installers[Math.floor(Math.random() * installers.length)] : null,
        sender: Math.random() > 0.4 ? sellers[Math.floor(Math.random() * sellers.length)] : null,
        
        // Dates
        dataMatjes: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        dita: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
      };
      
      orderDetails.push(orderDetailData);
    }

    await OrderDetails.bulkCreate(orderDetails);
    console.log(`✅ Created ${orderDetails.length} detailed order specifications`);

    // Create comprehensive payment information
    console.log('💰 Creating payment information...');
    
    for (const order of createdOrders) {
      const isGarageDoor = order.tipiPorosise === 'derë garazhi';
      const isKapak = order.tipiPorosise === 'kapak';
      const isCombined = order.tipiPorosise === 'derë garazhi + kapak';
      
      // Price ranges based on order type
      let cmimiTotal;
      if (isGarageDoor) {
        cmimiTotal = Math.floor(Math.random() * 300) + 400; // 400-699 EUR
      } else if (isCombined) {
        cmimiTotal = Math.floor(Math.random() * 400) + 600; // 600-999 EUR (higher for combined)
      } else if (isKapak) {
        cmimiTotal = Math.floor(Math.random() * 200) + 150; // 150-349 EUR
      } else { // derë dhome
        cmimiTotal = Math.floor(Math.random() * 150) + 100; // 100-249 EUR
      }

      const kaparja = Math.floor(cmimiTotal * (0.2 + Math.random() * 0.6)); // 20-80% of total
      const isFullyPaid = Math.random() > 0.6;
      const finalKaparja = isFullyPaid ? cmimiTotal : kaparja;

      const paymentData = {
        orderId: order.id,
        cmimiTotal: cmimiTotal,
        kaparja: finalKaparja,
        kaparaReceiver: Math.random() > 0.1 ? sellers[Math.floor(Math.random() * sellers.length)] : null,
        menyraPageses: Math.random() > 0.7 ? 'banke' : 'kesh',
        isPaymentDone: isFullyPaid,
        debtType: isFullyPaid ? 'none' : (Math.random() > 0.5 ? 'kesh' : 'banke')
      };
      
      payments.push(paymentData);
    }

    await Payment.bulkCreate(payments);
    console.log(`✅ Created ${payments.length} payment records`);

    // Create supplementary orders for some garage door orders
    console.log('📄 Creating supplementary orders...');
    
    const garageDoorOrders = createdOrders.filter(order => 
      order.tipiPorosise === 'derë garazhi' || order.tipiPorosise === 'derë garazhi + kapak'
    );
    const supplementaryCount = Math.min(8, garageDoorOrders.length); // Max 8 supplementary orders
    
    for (let i = 0; i < supplementaryCount; i++) {
      const parentOrder = garageDoorOrders[i];
      const customer = customers.find(c => c.id === parentOrder.customerId);
      
      const supplementaryProducts = [
        'Keramika për zonën e derës së garazhit',
        'Materiale shtesë për instalimin profesional',
        'Aksesore dhe pjesë rezervë cilësore',
        'Servis mirëmbajtjeje dhe garantie',
        'Izolim shtesë termik dhe akustik',
        'Automatizim dhe sisteme kontrolli',
        'Riparime dhe azhurnime',
        'Konsultime teknike dhe mbështetje'
      ];

      const cmimiTotal = Math.floor(Math.random() * 150) + 50; // 50-199 EUR
      const kaparja = Math.floor(cmimiTotal * (0.1 + Math.random() * 0.5)); // 10-60% of total
      const isSupplementaryPaid = Math.random() > 0.5;
      const finalKaparja = isSupplementaryPaid ? cmimiTotal : kaparja;

      const supplementaryData = {
        parentOrderId: parentOrder.id,
        emriKlientit: customer.emri,
        mbiemriKlientit: customer.mbiemri,
        numriTelefonit: customer.telefoni,
        vendi: customer.vendi,
        pershkrimiProduktit: supplementaryProducts[Math.floor(Math.random() * supplementaryProducts.length)],
        cmimiTotal: cmimiTotal,
        kaparja: finalKaparja,
        kaparaReceiver: Math.random() > 0.2 ? sellers[Math.floor(Math.random() * sellers.length)] : null,
        pagesaMbetur: cmimiTotal - finalKaparja,
        menyraPageses: Math.random() > 0.6 ? 'banke' : 'kesh',
        isPaymentDone: isSupplementaryPaid,
        statusi: ['në proces', 'e përfunduar', 'borxh'][Math.floor(Math.random() * 3)]
      };
      
      supplementaryOrders.push(supplementaryData);
    }

    if (supplementaryOrders.length > 0) {
      await SupplementaryOrder.bulkCreate(supplementaryOrders);
      console.log(`✅ Created ${supplementaryOrders.length} supplementary orders`);
    }

    // Final comprehensive summary
    console.log('\n📊 COMPREHENSIVE SEEDING SUMMARY:');
    console.log('=================================');
    console.log(`👥 Total Customers: ${customers.length}`);
    console.log(`📦 New Orders: ${createdOrders.length}`);
    console.log(`📋 Order Details: ${orderDetails.length}`);
    console.log(`💰 Payments: ${payments.length}`);
    console.log(`📄 Supplementary Orders: ${supplementaryOrders.length}`);

    // Order type distribution
    const orderTypeCounts = {};
    createdOrders.forEach(order => {
      orderTypeCounts[order.tipiPorosise] = (orderTypeCounts[order.tipiPorosise] || 0) + 1;
    });

    console.log('\n🏷️  ORDER TYPE DISTRIBUTION:');
    Object.entries(orderTypeCounts).forEach(([type, count]) => {
      const emoji = type === 'derë garazhi' ? '🚪' : 
                   type === 'kapak' ? '🏠' : 
                   type === 'derë garazhi + kapak' ? '🚪🏠' : '🚪';
      console.log(`  ${emoji} ${type}: ${count} orders`);
    });

    // Payment status overview
    const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.cmimiTotal), 0);
    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.kaparja), 0);
    const totalPending = totalRevenue - totalPaid;

    console.log('\n💰 FINANCIAL OVERVIEW:');
    console.log('=====================');
    console.log(`💶 Total Revenue: €${totalRevenue.toFixed(2)}`);
    console.log(`✅ Total Paid: €${totalPaid.toFixed(2)}`);
    console.log(`⏳ Total Pending: €${totalPending.toFixed(2)}`);
    console.log(`📊 Payment Rate: ${((totalPaid/totalRevenue)*100).toFixed(1)}%`);

    // Status distribution
    const statusCounts = {};
    orderDetails.forEach(detail => {
      statusCounts[detail.statusi] = (statusCounts[detail.statusi] || 0) + 1;
    });

    console.log('\n📈 ORDER STATUS DISTRIBUTION:');
    console.log('============================');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const emoji = status === 'në proces' ? '🔄' : status === 'e përfunduar' ? '✅' : '⚠️';
      console.log(`  ${emoji} ${status}: ${count} orders`);
    });

    // Personnel assignments summary
    const measurementStatus = orderDetails.reduce((acc, detail) => {
      acc[detail.statusiMatjes] = (acc[detail.statusiMatjes] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📏 MEASUREMENT STATUS:');
    console.log('=====================');
    Object.entries(measurementStatus).forEach(([status, count]) => {
      const emoji = status === 'e matur' ? '✅' : '⏳';
      console.log(`  ${emoji} ${status}: ${count} orders`);
    });

    console.log('\n🎉 Comprehensive data seeding completed successfully!');
    console.log('💡 Your application now has complete, realistic sample data including:');
    console.log('   • 📋 Full customer profiles and contact information');
    console.log('   • 📐 Detailed order specifications with measurements');
    console.log('   • 💳 Complete payment tracking and financial records');
    console.log('   • 📄 Supplementary order management for extras');
    console.log('   • 📅 Daily capacity planning and scheduling');
    console.log('   • 👷 Personnel assignments (measurers, installers, senders)');
    console.log('   • 🔄 Status tracking and progress monitoring');
    console.log('   • 🎯 Different order types (garage doors, kapaks, room doors)');
    console.log('   • 💰 Financial analytics and payment status tracking');

  } catch (error) {
    console.error('❌ Error during comprehensive seeding:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close connection
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the comprehensive seeding function
comprehensiveSeedData(); 