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
app.use("/api/capacity", require("./routes/capacityRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// Add a root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Lindidoors API! Use /api/users, /api/orders, /api/capacity, or /api/notifications to access the API endpoints.' });
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

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectPostgres();
    
    // Sync models with database
    await sequelize.sync();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();