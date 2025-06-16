const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config({ path: './backend/.env' });

// Database connection using environment variables (same as your backend)
const sequelize = new Sequelize(
  process.env.DB_NAME || 'lindidoors',
  process.env.DB_USER || 'postgres', 
  process.env.DB_PASS || process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// Define the Order model (matching your backend model)
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  emriKlientit: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mbiemriKlientit: {
    type: DataTypes.STRING,
    allowNull: false
  },
  numriTelefonit: {
    type: DataTypes.STRING,
    allowNull: false
  },
  vendi: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipiPorosise: {
    type: DataTypes.ENUM('derë garazhi', 'kapak', 'derë garazhi + kapak'),
    allowNull: false
  },
  dataDorezimit: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  cmimiTotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  kaparja: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  statusi: {
    type: DataTypes.ENUM('në proces', 'e përfunduar', 'borxh'),
    defaultValue: 'në proces'
  },
  statusiProduktit: {
    type: DataTypes.ENUM('në proces', 'e përfunduar'),
    defaultValue: 'në proces'
  },
  shitesi: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pershkrimi: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isPaymentDone: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'Orders',
  timestamps: true
});

// Test orders data
const testOrders = [
  // June 16, 2024 orders
  {
    emriKlientit: 'Arben',
    mbiemriKlientit: 'Krasniqi',
    numriTelefonit: '+383 44 123 456',
    vendi: 'Prishtinë',
    tipiPorosise: 'derë garazhi',
    dataDorezimit: '2024-06-16',
    cmimiTotal: 850.00,
    kaparja: 200.00,
    statusi: 'në proces',
    statusiProduktit: 'në proces',
    shitesi: 'Test User',
    pershkrimi: 'Test order për swap functionality',
    isPaymentDone: false
  },
  {
    emriKlientit: 'Besnik',
    mbiemriKlientit: 'Ahmeti',
    numriTelefonit: '+383 44 234 567',
    vendi: 'Ferizaj',
    tipiPorosise: 'derë garazhi',
    dataDorezimit: '2024-06-16',
    cmimiTotal: 920.00,
    kaparja: 300.00,
    statusi: 'në proces',
    statusiProduktit: 'në proces',
    shitesi: 'Test User',
    pershkrimi: 'Test order për swap functionality',
    isPaymentDone: false
  },
  
  // June 18, 2024 orders
  {
    emriKlientit: 'Driton',
    mbiemriKlientit: 'Berisha',
    numriTelefonit: '+383 44 345 678',
    vendi: 'Gjakovë',
    tipiPorosise: 'derë garazhi',
    dataDorezimit: '2024-06-18',
    cmimiTotal: 780.00,
    kaparja: 150.00,
    statusi: 'në proces',
    statusiProduktit: 'në proces',
    shitesi: 'Test User',
    pershkrimi: 'Test order për swap functionality',
    isPaymentDone: false
  },
  {
    emriKlientit: 'Enis',
    mbiemriKlientit: 'Gashi',
    numriTelefonit: '+383 44 456 789',
    vendi: 'Pejë',
    tipiPorosise: 'derë garazhi',
    dataDorezimit: '2024-06-18',
    cmimiTotal: 1050.00,
    kaparja: 400.00,
    statusi: 'në proces',
    statusiProduktit: 'në proces',
    shitesi: 'Test User',
    pershkrimi: 'Test order për swap functionality',
    isPaymentDone: false
  },
  {
    emriKlientit: 'Fatmir',
    mbiemriKlientit: 'Hoxha',
    numriTelefonit: '+383 44 567 890',
    vendi: 'Mitrovicë',
    tipiPorosise: 'derë garazhi',
    dataDorezimit: '2024-06-18',
    cmimiTotal: 890.00,
    kaparja: 250.00,
    statusi: 'në proces',
    statusiProduktit: 'në proces',
    shitesi: 'Test User',
    pershkrimi: 'Test order për swap functionality',
    isPaymentDone: false
  }
];

async function addTestOrders() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    console.log(`📊 Connected to: ${process.env.DB_NAME || 'lindidoors'} on ${process.env.DB_HOST || 'localhost'}`);
    
    // Add the test orders
    console.log('🔄 Adding test orders...');
    
    for (const orderData of testOrders) {
      try {
        const order = await Order.create(orderData);
        console.log(`✅ Added order: ${order.emriKlientit} ${order.mbiemriKlientit} (ID: ${order.id}) - ${order.dataDorezimit}`);
      } catch (error) {
        console.error(`❌ Error adding order for ${orderData.emriKlientit} ${orderData.mbiemriKlientit}:`, error.message);
      }
    }
    
    console.log('\n🎉 Test orders added successfully!');
    console.log('\n📅 Orders added:');
    console.log('June 16, 2024: Arben Krasniqi, Besnik Ahmeti');
    console.log('June 18, 2024: Driton Berisha, Enis Gashi, Fatmir Hoxha');
    console.log('\n🔄 You can now test the swap functionality between these orders!');
    console.log('\n🧪 Test scenarios:');
    console.log('1. Swap Arben (June 16) ↔ Driton (June 18)');
    console.log('2. Swap Besnik (June 16) ↔ Enis (June 18)');
    console.log('3. Use the search feature to find specific orders');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure your PostgreSQL server is running');
    console.log('2. Check that the backend/.env file has correct database credentials');
    console.log('3. Verify the database name is "lindidoors"');
    console.log('4. Run this from the project root directory');
  } finally {
    await sequelize.close();
  }
}

// Run the script
addTestOrders(); 