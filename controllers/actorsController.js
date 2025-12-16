// controllers/actorsController.js
// ......................................................
// Actor endpoints
// - GET /actors        -> list a few actors
// - GET /actors/:id    -> single actor by nconst
//  ......................................................


const { pool } = require("../db/pool");

// GET /actors - basic list
exports.getAllActors = async (req, res, next) => {
  try {
    // just return the first 50 actors
    const [rows] = await pool.query(`
      SELECT nconst, primaryName, primaryProfession, knownForTitles
      FROM names
      LIMIT 50
    `);

    return res.json({
      count: rows.length,
      results: rows
    });
  } catch (err) {
    next(err);
  }
};

// GET /actors/:id
exports.getActorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT nconst, primaryName, birthYear, deathYear, primaryProfession, knownForTitles
      FROM names
      WHERE nconst = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: true, message: "Actor not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};
