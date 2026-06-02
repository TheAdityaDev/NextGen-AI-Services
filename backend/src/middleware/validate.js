const { validationResult } = require("express-validator");
const { sendError } = require("../utils/apiResponse");

/**
 * validate — reads results from express-validator chain
 * and returns a 422 if any rules failed.
 * Place this after your validation rule arrays in routes.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return sendError(res, "Validation failed", 422, formatted);
  }
  next();
};

module.exports = validate;