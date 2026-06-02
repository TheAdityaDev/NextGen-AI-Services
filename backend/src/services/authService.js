const { User, ROLES } = require("../models/User");
const { generateAuthTokens } = require("../utils/jwt");
const { cacheUserSession } = require("./redisService");
const AppError = require("../utils/AppError");

/**
 * Create a new company admin user.
 */
const createCompanyAdmin = async ({ firstName, lastName, email, password, tenantId }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: ROLES.COMPANY_ADMIN,
    tenantId,
    isVerified: true, // Self-registered admin is auto-verified
  });

  return user;
};

/**
 * Create a new support agent user.
 */
const createSupportAgent = async ({ firstName, lastName, email, password, tenantId }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: ROLES.SUPPORT_AGENT,
    tenantId,
  });

  return user;
};

/**
 * Authenticate a user by email + password.
 * Returns user + tokens on success.
 */
const loginUser = async ({ email, password }) => {
  // Explicitly select password (it's excluded by default)
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account has been deactivated. Contact your admin.", 403);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password.", 401);
  }

  // Update last login timestamp
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const tokens = generateAuthTokens(user);

  // Cache session in Redis for fast socket auth lookups
  await cacheUserSession(user._id.toString(), {
    userId: user._id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  });

  return { user, tokens };
};

/**
 * Get current user profile (the /me endpoint).
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);
  return user;
};

module.exports = {
  createCompanyAdmin,
  createSupportAgent,
  loginUser,
  getCurrentUser,
};