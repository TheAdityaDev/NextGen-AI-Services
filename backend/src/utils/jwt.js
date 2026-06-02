const jwt = require("jsonwebtoken");

/**
 * Sign an access token
 */
const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    issuer: "chatframe",
    audience: "chatframe-client",
  });
};

/**
 * Sign a refresh token
 */
const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    issuer: "chatframe",
    audience: "chatframe-client",
  });
};

/**
 * Verify access token — throws on failure
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: "chatframe",
    audience: "chatframe-client",
  });
};

/**
 * Verify refresh token — throws on failure
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: "chatframe",
    audience: "chatframe-client",
  });
};

/**
 * Build the token payload from a user document
 */
const buildTokenPayload = (user) => ({
  sub: user._id.toString(),
  email: user.email,
  role: user.role,
  tenantId: user.tenantId,
});

/**
 * Generate both tokens and return auth response shape
 */
const generateAuthTokens = (user) => {
  const payload = buildTokenPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  };
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  buildTokenPayload,
  generateAuthTokens,
};