const { loginUser, getCurrentUser } = require("../services/authService");
const { blacklistToken, invalidateUserSession } = require("../services/redisService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * POST /api/auth/login
 * Authenticate any user type (admin, agent, super_admin) by email + password.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, tokens } = await loginUser({ email, password });

  sendSuccess(
    res,
    {
      user: user.toAuthJSON(),
      tokens,
    },
    "Login successful."
  );
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 * Requires: authMiddleware
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user._id);

  sendSuccess(res, { user: user.toAuthJSON() }, "User profile retrieved.");
});

/**
 * POST /api/auth/logout
 * Blacklists the current access token and clears Redis session.
 * Requires: authMiddleware
 */
const logout = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    // Blacklist for 7 days (matches JWT_EXPIRES_IN)
    await blacklistToken(token, 60 * 60 * 24 * 7);
  }

  // Invalidate Redis session
  await invalidateUserSession(req.user._id.toString());

  sendSuccess(res, {}, "Logged out successfully.");
});

module.exports = { login, getMe, logout };