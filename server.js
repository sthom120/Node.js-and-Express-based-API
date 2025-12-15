// server.js
// ------------------------------------------------------
// Main entry point for the API
// - Sets up Express
// - Adds middleware (CORS, JSON parsing, PNG parsing for posters)
// - Connects route files (movies, actors, users, posters, etc.)
// - Starts HTTP (and local HTTPS) servers
// ------------------------------------------------------

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const https = require("https");

// ------------------------------------------------------
// 1) Load environment variables from .env
// ------------------------------------------------------
dotenv.config();

// ------------------------------------------------------
// 2) Create the Express app
// ------------------------------------------------------
const app = express();

// ------------------------------------------------------
// 3) Global middleware
// ------------------------------------------------------

// Allow requests from other origins (useful for client apps)
app.use(cors());

// Parse JSON bodies for most endpoints (e.g., /user/register, /user/login)
app.use(express.json());

// Parse RAW PNG bodies ONLY for /posters routes (poster uploads are binary)
app.use("/posters", express.raw({ type: "image/png", limit: "10mb" }));

// ------------------------------------------------------
// 4) Basic health check route (easy way to see if API is up)
// ------------------------------------------------------
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// ------------------------------------------------------
// 5) Import routers (each router handles a group of endpoints)
// ------------------------------------------------------
const dbTestRouter = require("./routes/dbTest");
const actorsRouter = require("./routes/actors");
const moviesRouter = require("./routes/movies");
const searchRouter = require("./routes/search");
const postersRouter = require("./routes/posters");
const usersRouter = require("./routes/users");

// ------------------------------------------------------
// 6) Mount routers onto URL paths
// ------------------------------------------------------
app.use("/", dbTestRouter);        // GET /db-test
app.use("/actors", actorsRouter);  // GET /actors, GET /actors/:id
app.use("/movies", moviesRouter);  // GET /movies/search, GET /movies/data/:imdbID, etc.
app.use("/search", searchRouter);  // GET /search?q=...
app.use("/posters", postersRouter);// GET /posters/:imdbID, POST /posters/add/:imdbID

// Swagger expects /user/register and /user/login
app.use("/user", usersRouter);     // POST /user/register, POST /user/login

// ------------------------------------------------------
// 7) 404 handler (if no routes matched)
// ------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: "Route not found"
  });
});

// ------------------------------------------------------
// 8) Error handler (catches thrown errors / next(err))
// ------------------------------------------------------
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// ------------------------------------------------------
// 9) Start the server(s)
// ------------------------------------------------------

// Hosting platforms (like Render) provide the PORT environment variable
const PORT = process.env.PORT || 3000;

// Always start HTTP (this is what most deployment platforms expect)
app.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
});

// OPTIONAL: Start HTTPS locally only (self-signed cert)
// This avoids deployment crashes if ssl files don’t exist on the host.
if (process.env.NODE_ENV !== "production") {
  const HTTPS_PORT = 3001;

  const sslKeyPath = "./ssl/key.pem";
  const sslCertPath = "./ssl/cert.pem";

  // Only start HTTPS if the cert files exist
  if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    const sslOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    };

    https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
      console.log(`HTTPS server running on https://localhost:${HTTPS_PORT}`);
    });
  } else {
    console.log("HTTPS not started (missing ./ssl/key.pem or ./ssl/cert.pem)");
  }
}
