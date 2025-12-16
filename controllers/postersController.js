// controllers/postersController.js
// ......................................
// Poster upload + retrieval (per-user posters)
// - GET  /posters/:imdbID
// - POST /posters/add/:imdbID  (raw image/png body)
// .......................................

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

// Folder to store poster files
const POSTER_DIR = path.join(__dirname, "..", "res", "posters");

// Make sure the folder exists (so uploads don't fail)
fs.mkdirSync(POSTER_DIR, { recursive: true });

// ------------------------------------------------------
// Helper: get user email from Authorization: Bearer token
// - If header is missing or token is invalid it should return null
// ------------------------------------------------------
function getEmailFromAuthHeader(authHeader) {
  try {
    if (!authHeader) return null;

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return null;

    const token = parts[1];

    // Verify token and read
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // store email in the token payload during login
    return payload.email || null;
  } catch {
    return null;
  }
}

// ......................................................
// GET /posters/:imdbID
// Returns the user's saved poster (PNG) for that imdbID
// ......................................................
exports.getPoster = async (req, res) => {
  try {
    const { imdbID } = req.params;

    // Swagger: reject query parameters
    if (Object.keys(req.query).length > 0) {
      const invalidKey = Object.keys(req.query)[0];
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${invalidKey}. Query parameters are not permitted.`
      });
    }

    // Swagger: must have Bearer token
    const email = getEmailFromAuthHeader(req.headers.authorization);
    if (!email) {
      return res.status(401).json({
        error: true,
        message: "Authorization header ('Bearer token') not found"
      });
    }

    const filename = `${imdbID}_${email}.png`;
    const filepath = path.join(POSTER_DIR, filename);

    const data = await fs.promises.readFile(filepath);

    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(data);
  } catch (err) {
    // Swagger examples commonly show this as a 500 with the raw error message (e.g., ENOENT)
    return res.status(500).json({
      error: true,
      message: err.message
    });
  }
};

// .......................................................
// POST /posters/add/:imdbID
// Upload a PNG (raw binary)
// ........................................................
exports.uploadPoster = async (req, res) => {
  try {
    const { imdbID } = req.params;

    // Swagger: reject query parameters
    if (Object.keys(req.query).length > 0) {
      const invalidKey = Object.keys(req.query)[0];
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${invalidKey}. Query parameters are not permitted.`
      });
    }

    // Swagger: must have Bearer token
    const email = getEmailFromAuthHeader(req.headers.authorization);
    if (!email) {
      return res.status(401).json({
        error: true,
        message: "Authorization header ('Bearer token') not found"
      });
    }

    // Swagger: only accept PNG uploads
    if (!req.is("image/png")) {
      return res.status(400).json({
        error: true,
        message: "Only image/png content is accepted."
      });
    }

    const filename = `${imdbID}_${email}.png`;
    const filepath = path.join(POSTER_DIR, filename);

    
    await fs.promises.writeFile(filepath, req.body);

    return res.status(200).json({
      error: false,
      message: "Poster Uploaded Successfully"
    });
  } catch (err) {
    return res.status(500).json({
      error: true,
      message: err.message
    });
  }
};
