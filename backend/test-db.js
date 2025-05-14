const { connectPostgres, sequelize } = require("./src/config/database");

async function testConnection() {
  try {
    await connectPostgres();
    console.log("Database connection successful!");
    
    // Test a simple query
    const result = await sequelize.query("SELECT NOW()");
    console.log("Current timestamp:", result[0][0]);

    // Close connection
    await sequelize.close();
    console.log("Connection closed.");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

testConnection(); 