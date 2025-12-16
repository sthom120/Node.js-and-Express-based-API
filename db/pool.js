// db/pool.js
// .......................................................
// Creates a reusable MySQL connection pool.
// All controllers import { pool } from here and do:
//   const [rows] = await pool.query(sql, params);
// .......................................................

const mysql = require("mysql2/promise");

// Read DB settings from environment variables (Railway Variables)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),

  // These help a lot in production
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = { pool };
