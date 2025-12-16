// controllers/moviesController.js
// ..................................................
// Movie endpoints
// - GET /movies                 -> basic list (helper endpoint)
// - GET /movies/:tconst         -> full movie details
// - GET /movies/search?title=   -> Swagger search endpoint
// - GET /movies/data/:imdbID    -> Swagger OMDb-style endpoint
// ...............................................

const { pool } = require("../db/pool");

// GET /movies
exports.getAllMovies = async (req, res, next) => {
  try {
    const { title, year, limit = 20, offset = 0 } = req.query;

    // Start with a base query to add filters to
    let sql = `
      SELECT
        b.tconst,
        b.primaryTitle,
        b.startYear,
        b.genres,
        r.averageRating,
        r.numVotes
      FROM basics b
      LEFT JOIN ratings r ON b.tconst = r.tconst
      WHERE 1 = 1
    `;

    const params = [];

    if (title) {
      sql += " AND b.primaryTitle LIKE ?";
      params.push(`%${title}%`);
    }

    if (year) {
      sql += " AND b.startYear = ?";
      params.push(year);
    }

    sql += " LIMIT ? OFFSET ?";
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(sql, params);

    return res.json({
      count: rows.length,
      results: rows
    });
  } catch (err) {
    next(err);
  }
};

// GET /movies/:tconst
exports.getMovieById = async (req, res, next) => {
  try {
    const { tconst } = req.params;

    // 1) Basic movie and rating
    const [movieRows] = await pool.query(
      `
      SELECT
        b.tconst,
        b.primaryTitle,
        b.originalTitle,
        b.titleType,
        b.startYear,
        b.genres,
        r.averageRating,
        r.numVotes
      FROM basics b
      LEFT JOIN ratings r ON b.tconst = r.tconst
      WHERE b.tconst = ?
      `,
      [tconst]
    );

    if (movieRows.length === 0) {
      return res.status(404).json({ error: true, message: "Movie not found" });
    }

    const movie = movieRows[0];

    // 2) Crew
    const [crewRows] = await pool.query(
      `SELECT directors, writers FROM crew WHERE tconst = ?`,
      [tconst]
    );

    movie.directors = crewRows.length > 0 ? crewRows[0].directors : "";
    movie.writers = crewRows.length > 0 ? crewRows[0].writers : "";

    // 3) Cast list
    const [castRows] = await pool.query(
      `
      SELECT
        n.nconst,
        n.primaryName,
        p.category,
        p.characters
      FROM principals p
      JOIN names n ON n.nconst = p.nconst
      WHERE p.tconst = ?
      ORDER BY p.ordering ASC
      `,
      [tconst]
    );

    movie.cast = castRows;

    return res.json(movie);
  } catch (err) {
    next(err);
  }
};

// GET /movies/search  (Swagger)
exports.searchMovies = async (req, res, next) => {
  try {
    const { title, year, page = 1 } = req.query;

    // Swagger: title required
    if (!title) {
      return res.status(400).json({
        error: true,
        message: "Title query parameter is required."
      });
    }

    // Swagger: year must be yyyy if provided
    if (year && !/^\d{4}$/.test(year)) {
      return res.status(400).json({
        error: true,
        message: "Invalid year format. Format must be yyyy."
      });
    }

    const perPage = 100;
    const offset = (Number(page) - 1) * perPage;

    // Main results query
    let sql = `
      SELECT
        b.primaryTitle AS Title,
        b.startYear AS Year,
        b.tconst AS imdbID,
        b.titleType AS Type
      FROM basics b
      WHERE b.primaryTitle LIKE ?
    `;

    const params = [`%${title}%`];

    if (year) {
      sql += " AND b.startYear = ?";
      params.push(year);
    }

    sql += `
      ORDER BY imdbID ASC
      LIMIT ? OFFSET ?
    `;
    params.push(perPage, offset);

    const [rows] = await pool.query(sql, params);

    // Count query (for pagination)
    let countSql = `
      SELECT COUNT(*) AS total
      FROM basics
      WHERE primaryTitle LIKE ?
    `;
    const countParams = [`%${title}%`];

    if (year) {
      countSql += " AND startYear = ?";
      countParams.push(year);
    }

    const [totalRows] = await pool.query(countSql, countParams);
    const total = totalRows[0].total;

    const lastPage = Math.ceil(total / perPage);
    const from = offset;
    const to = offset + rows.length;

    return res.json({
      data: rows,
      pagination: {
        total,
        lastPage,
        perPage,
        currentPage: Number(page),
        from,
        to
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /movies/data/:imdbID (Swagger)
exports.getMovieData = async (req, res, next) => {
  try {
    const { imdbID } = req.params;

    // Swagger: no query parameterss allowed
    if (Object.keys(req.query).length > 0) {
      const invalidKey = Object.keys(req.query)[0];
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${invalidKey}. Query parameters are not permitted.`
      });
    }

    // 1) Basic movie fields and rating
    const [movieRows] = await pool.query(
      `
      SELECT
        b.primaryTitle,
        b.startYear,
        b.runtimeMinutes,
        b.genres,
        r.averageRating
      FROM basics b
      LEFT JOIN ratings r ON b.tconst = r.tconst
      WHERE b.tconst = ?
      `,
      [imdbID]
    );

    if (movieRows.length === 0) {
      return res.status(404).json({ error: true, message: "Movie not found" });
    }

    const movie = movieRows[0];

    // 2) Crew
    const [crewRows] = await pool.query(
      `SELECT directors, writers FROM crew WHERE tconst = ?`,
      [imdbID]
    );

    const directors = crewRows.length > 0 ? crewRows[0].directors || "" : "";
    const writers = crewRows.length > 0 ? crewRows[0].writers || "" : "";

    // 3) Cast names as a comma-separated string
    const [castRows] = await pool.query(
      `
      SELECT n.primaryName
      FROM principals p
      JOIN names n ON n.nconst = p.nconst
      WHERE p.tconst = ?
      ORDER BY p.ordering ASC
      `,
      [imdbID]
    );

    const actors =
      castRows.length > 0 ? castRows.map((r) => r.primaryName).join(",") : "";

    // 4) Ratings array (OMDb-style)
    const ratings = [];
    if (movie.averageRating != null) {
      ratings.push({
        Source: "Internet Movie Database",
        Value: `${movie.averageRating}/10`
      });
    }

    // 5) Build the exact response shape Swagger shows
    return res.json({
      Title: movie.primaryTitle || "",
      Year: movie.startYear ? String(movie.startYear) : "",
      Runtime: movie.runtimeMinutes ? `${movie.runtimeMinutes} min` : "",
      Genre: movie.genres || "",
      Director: directors,
      Writer: writers,
      Actors: actors,
      Ratings: ratings
    });
  } catch (err) {
    next(err);
  }
};
