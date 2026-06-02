const { getRedis } = require("../config/redis");

const PREFIXES = {
  ONBOARD_SESSION: "onboard:session",
  TOKEN_BLACKLIST: "auth:blacklist",
  USER_SESSION: "user:session",
};

/**
 * Store onboarding step data temporarily in Redis.
 * Allows multi-step onboarding without DB writes until completion.
 *
 * @param {string} sessionId — unique onboarding session identifier
 * @param {object} data — accumulated onboarding data
 * @param {number} ttl — TTL in seconds (default: 30 minutes)
 */
const setOnboardingSession = async (sessionId, data, ttl = 1800) => {
  const redis = getRedis();
  const key = `${PREFIXES.ONBOARD_SESSION}:${sessionId}`;
  await redis.set(key, JSON.stringify(data), "EX", ttl);
};

/**
 * Retrieve onboarding session data from Redis.
 */
const getOnboardingSession = async (sessionId) => {
  const redis = getRedis();
  const key = `${PREFIXES.ONBOARD_SESSION}:${sessionId}`;
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
};

/**
 * Delete onboarding session (after completion or abandonment).
 */
const deleteOnboardingSession = async (sessionId) => {
  const redis = getRedis();
  const key = `${PREFIXES.ONBOARD_SESSION}:${sessionId}`;
  await redis.del(key);
};

/**
 * Blacklist a JWT token (on logout or password change).
 * TTL should match the token's remaining expiry.
 *
 * @param {string} token — the raw JWT string
 * @param {number} ttl — seconds until token would have expired
 */
const blacklistToken = async (token, ttl = 86400) => {
  const redis = getRedis();
  const key = `${PREFIXES.TOKEN_BLACKLIST}:${token}`;
  await redis.set(key, "1", "EX", ttl);
};

/**
 * Check whether a token has been blacklisted.
 */
const isTokenBlacklisted = async (token) => {
  const redis = getRedis();
  const key = `${PREFIXES.TOKEN_BLACKLIST}:${token}`;
  const result = await redis.get(key);
  return result === "1";
};

/**
 * Cache a user session payload (useful for socket auth lookup).
 */
const cacheUserSession = async (userId, sessionData, ttl = 86400 * 7) => {
  const redis = getRedis();
  const key = `${PREFIXES.USER_SESSION}:${userId}`;
  await redis.set(key, JSON.stringify(sessionData), "EX", ttl);
};

/**
 * Retrieve cached user session.
 */
const getCachedUserSession = async (userId) => {
  const redis = getRedis();
  const key = `${PREFIXES.USER_SESSION}:${userId}`;
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
};

/**
 * Invalidate user session cache (on logout, role change, etc.)
 */
const invalidateUserSession = async (userId) => {
  const redis = getRedis();
  const key = `${PREFIXES.USER_SESSION}:${userId}`;
  await redis.del(key);
};

module.exports = {
  setOnboardingSession,
  getOnboardingSession,
  deleteOnboardingSession,
  blacklistToken,
  isTokenBlacklisted,
  cacheUserSession,
  getCachedUserSession,
  invalidateUserSession,
};