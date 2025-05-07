// config/postgres.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log("Lidhja me PostgreSQL u realizua me sukses!");
  } catch (error) {
    console.error("Gabim në lidhjen me PostgreSQL:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectPostgres };
