// db/pool.js
// ------------------------------------------------------
// Creates a MySQL connection pool using environment variables
// ------------------------------------------------------

const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Create pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

module.exports = { pool };
