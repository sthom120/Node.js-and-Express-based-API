// controllers/usersController.js
// .......................................................
// User endpoints for Swagger
// - POST /user/register   -> create a user
// - POST /user/login      -> login and receive a Bearer token (JWT)
// .......................................................  
// User endpoints for Swagger
// - POST /user/register   -> create a user
// - POST /user/login      -> login and receive a Bearer token (JWT)
// .......................................................

const { pool } = require("../db/pool");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Swagger uses 86400 seconds (= 24 hours)
const EXPIRES_IN_SECONDS = 86400;

// Helper: always return errors in the same JSON shape
function sendError(res, status, message) {
  return res.status(status).json({
    error: true,
    message
  });
}

//........................ .......................................
// POST /user/register
// Body: { "email": "...", "password": "..." }
//................................................................
exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    // Swagger: 400 if either field is missing
    if (!email || !password) {
      return sendError(
        res,
        400,
        "Request body incomplete, both email and password are required"
      );
    }

    // Swagger screenshot suggests invalid email can be a 400 case
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return sendError(res, 400, "Invalid email address");
    }

    // Check if this email is already in the database
    const [existing] = await pool.query(
      "SELECT email FROM users WHERE email = ?",
      [email]
    );

    // Swagger: 409 if the user already exists
    if (existing.length > 0) {
      return sendError(res, 409, "User already exists.");
    }

    // Hash the password (never store plain passwords)
    const hash = await bcrypt.hash(password, 10);

    // Store the user in the database
    await pool.query(
      "INSERT INTO users (email, hash) VALUES (?, ?)",
      [email, hash]
    );

    // Swagger: 201 success message
    return res.status(201).json({ message: "User created" });
  } catch (err) {
    next(err);
  }
};

// .......................................................
// POST /user/login
// Body: { "email": "...", "password": "..." }
// .......................................................
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    // Swagger: 400 if either field is missing
    if (!email || !password) {
      return sendError(
        res,
        400,
        "Request body incomplete, both email and password are required"
      );
    }

    // Find the user record in the database
    const [rows] = await pool.query(
      "SELECT email, hash FROM users WHERE email = ?",
      [email]
    );

    // Swagger: 401 if email doesn't exist OR password is wrong
    if (rows.length === 0) {
      return sendError(res, 401, "Incorrect email or password");
    }

    const user = rows[0];

    // Compare password against the stored hash
    const match = await bcrypt.compare(password, user.hash);
    if (!match) {
      return sendError(res, 401, "Incorrect email or password");
    }

    // If JWT_SECRET is missing, the server can't create tokens
    if (!process.env.JWT_SECRET) {
      return sendError(res, 500, "Server configuration error");
    }

    // Create a JWT token that contains the user's email
    const token = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: EXPIRES_IN_SECONDS }
    );

    // Swagger: return token object in this exact format
    return res.status(200).json({
      token,
      token_type: "Bearer",
      expires_in: EXPIRES_IN_SECONDS
    });
  } catch (err) {
    next(err);
  }
};
