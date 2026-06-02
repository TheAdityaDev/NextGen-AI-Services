const AppError = require("../utils/AppError");

/**
 * Handle Mongoose CastError (bad ObjectId, etc.)
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose duplicate key errors
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `A record with ${field} '${value}' already exists.`;
  return new AppError(message, 409);
};

/**
 * Handle Mongoose validation errors
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return new AppError("Validation failed", 422, errors);
};

/**
 * Handle JWT errors (token verification failures)
 */
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Your session has expired. Please log in again.", 401);

/**
 * Development error response — full stack trace
 */
const sendDevError = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

/**
 * Production error response — no internals exposed
 */
const sendProdError = (err, res) => {
  if (err.isOperational) {
    // Known, trusted error
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  } else {
    // Unknown error — log but don't expose details
    console.error("💥 UNHANDLED ERROR:", err);
    res.status(500).json({
      success: false,
      message: "An unexpected internal error occurred.",
    });
  }
};

/**
 * Global error handler middleware
 * Must have 4 params for Express to recognize it as error middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  let error = { ...err };
  error.message = err.message;
  error.isOperational = err.isOperational;

  // Normalize known error types
  if (err.name === "CastError") error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === "ValidationError") error = handleValidationError(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  if (process.env.NODE_ENV === "development") {
    sendDevError(error, res);
  } else {
    sendProdError(error, res);
  }
};

module.exports = errorHandler;