// routes/actors.js
// ------------------------------------------------------
// Routes for actor-related endpoints
// ------------------------------------------------------

const express = require("express");
const router = express.Router();
const actorsController = require("../controllers/actorsController");

// GET /actors
router.get("/", actorsController.getAllActors);

// GET /actors/:id
router.get("/:id", actorsController.getActorById);

module.exports = router;
