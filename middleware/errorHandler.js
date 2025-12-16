// middleware/errorHandler.js
// .......................................................
// Central Express error handler (must be the LAST middleware)
// Purpose:
// - Catch errors thrown in routes/controllers or passed via next(err)
// - Log them so I can debug
// - Send a consistent JSON response
//
// Response format used here:
//   { error: true, message: "..." }
// This matches the style used across Swagger endpoints.
// .......................................................

module.exports = (err, req, res, next) => {
  // 1) Log the error (server-side only)
  // This helps debugging without exposing details.
  console.error("ERROR:", err);

  // 2) Decide what HTTP status code to send
  // If the controller set err.status, use it; otherwise default to 500.
  const status = err.status || 500;

  // 3) Decide what message to show
  // If the controller gave a safe message, use it.
  // Otherwise use a generic message for internal server errors.
  const message =
    err.message ||
    (status === 500 ? "Internal Server Error" : "An error occurred");

  // 4) Send consistent JSON error response
  res.status(status).json({
    error: true,
    message
  });
};
