// routes/search.js
// .......................................................
// Unified movie + actor search route
// .......................................................

const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

router.get("/", searchController.searchAll);

module.exports = router;
