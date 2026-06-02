/**
 * Standardized API response envelope.
 * All responses follow: { success, message, data?, meta? }
 */

const sendSuccess = (res, data = {}, message = "Success", statusCode = 200, meta = {}) => {
  const payload = {
    success: true,
    message,
    data,
  };

  if (Object.keys(meta).length > 0) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

const sendCreated = (res, data = {}, message = "Created successfully") => {
  return sendSuccess(res, data, message, 201);
};

const sendError = (res, message = "Something went wrong", statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};

module.exports = { sendSuccess, sendCreated, sendError };