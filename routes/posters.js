// routes/posters.js
// .......................................................
// Poster upload and retrieval
// .......................................................

const express = require("express");
const router = express.Router();
const postersController = require("../controllers/postersController");

// GET /posters/:imdbID
router.get("/:imdbID", postersController.getPoster);

// POST /posters/add/:imdbID
router.post("/add/:imdbID", postersController.uploadPoster);

module.exports = router;
