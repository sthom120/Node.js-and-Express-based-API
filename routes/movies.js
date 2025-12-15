const express = require("express");
const router = express.Router();
const moviesController = require("../controllers/moviesController");

// ✅ Swagger-required endpoints first
router.get("/search", moviesController.searchMovies);
router.get("/data/:imdbID", moviesController.getMovieData);

// ✅ Optional/legacy but useful: GET /movies
router.get("/", moviesController.getAllMovies);

// ✅ Must be LAST
router.get("/:tconst", moviesController.getMovieById);

module.exports = router;
