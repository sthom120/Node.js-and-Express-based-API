// routes/dbTest.js
// ------------------------------------------------------
// Simple test route to confirm database connectivity
// ------------------------------------------------------

const express = require("express");
const { pool } = require("../db/pool");
const router = express.Router();

router.get("/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json({ success: true, dbResult: rows[0].result });
  } catch (err) {
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

module.exports = router;
