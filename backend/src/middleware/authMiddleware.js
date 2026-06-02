const { verifyAccessToken } = require("../utils/jwt");
const { User } = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * authMiddleware — verifies the JWT from the Authorization header
 * and attaches the decoded user to req.user.
 */
const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication token is missing or malformed", 401);
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Your session has expired. Please log in again.", 401);
    }
    throw new AppError("Invalid authentication token.", 401);
  }

  // Fetch fresh user from DB (validates account is still active)
  const user = await User.findById(decoded.sub).select("-password");

  if (!user) {
    throw new AppError("User account not found.", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account has been deactivated.", 403);
  }

  req.user = user;
  next();
});

module.exports = authMiddleware;