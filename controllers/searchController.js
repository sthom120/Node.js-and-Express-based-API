// controllers/searchController.js
// ------------------------------------------------------
// Unified search endpoint
// - GET /search?q=term  -> searches movies + actors
// ------------------------------------------------------

const { pool } = require("../db/pool");

exports.searchAll = async (req, res, next) => {
  try {
    const { q } = req.query;

    // Must have a search term
    if (!q || q.trim() === "") {
      return res.status(400).json({
        error: true,
        message: "Query parameter 'q' is required"
      });
    }

    const searchTerm = `%${q}%`;

    // Movies (basic results)
    const [movieRows] = await pool.query(
      `
      SELECT
        b.tconst,
        b.primaryTitle,
        b.startYear,
        b.genres,
        r.averageRating
      FROM basics b
      LEFT JOIN ratings r ON b.tconst = r.tconst
      WHERE b.primaryTitle LIKE ?
      LIMIT 20
      `,
      [searchTerm]
    );

    // Actors (basic results)
    const [actorRows] = await pool.query(
      `
      SELECT
        n.nconst,
        n.primaryName,
        n.primaryProfession,
        n.knownForTitles
      FROM names n
      WHERE n.primaryName LIKE ?
      LIMIT 20
      `,
      [searchTerm]
    );

    return res.json({
      query: q,
      moviesFound: movieRows.length,
      actorsFound: actorRows.length,
      movies: movieRows,
      actors: actorRows
    });
  } catch (err) {
    next(err);
  }
};
