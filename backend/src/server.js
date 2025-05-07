const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectPostgres, sequelize } = require("./config/database");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/capacity", require("./routes/capacityRoutes"));

app.get('/test', (req, res) => {
  res.send('Test route works!');
});

// 404 handler - only handle routes that weren't matched above
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;

// Start server
(async () => {
  try {
    console.log('Attempting to connect to database...');
    console.log('Database config:', {
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT
    });
    
    await connectPostgres(); // test the connection
    console.log('Database connection successful, syncing models...');
    
    await sequelize.sync({ alter: true }); // sync models to DB
    console.log('Models synced successfully');
    
    app.listen(PORT, () => {
      console.log(`Serveri është duke punuar në http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Gabim në startimin e serverit:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
})();