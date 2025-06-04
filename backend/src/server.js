const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectPostgres, sequelize } = require("./config/database");
const { sequelize: dbModels } = require('./models');

dotenv.config();

// Set default JWT_SECRET if not provided in environment variables
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "lindidoors_supersecretkey";
  console.log("Warning: Using default JWT_SECRET. Set this in your environment for production.");
}

const app = express();

app.use(cors());
app.use(express.json());

// Routes - notice these all include /api prefix to match frontend expectations
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/capacities", require("./routes/capacityRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/supplementary-orders", require("./routes/supplementaryOrderRoutes"));

// Add a root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Lindidoors API! Use /api/users, /api/orders, /api/capacities, /api/notifications, or /api/supplementary-orders to access the API endpoints.' });
});

// 404 handler - only handle routes that weren't matched above
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectPostgres();
    
    // Sync models with database
    await dbModels.sync();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Backend Server running on http://0.0.0.0:${PORT}`);
      console.log(`📱 Local access: http://localhost:${PORT}`);
      console.log(`🌐 Network access: http://[YOUR_IP_ADDRESS]:${PORT}`);
      console.log(`💡 Find your IP address with: ipconfig (Windows) or ifconfig (Mac/Linux)`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();