const { getRedis } = require("../config/redis");
const AppError = require("../utils/AppError");

/**
 * createRateLimiter — factory that returns an Express middleware
 * implementing a sliding-window rate limiter backed by Redis.
 *
 * @param {object} options
 * @param {number} options.windowMs   — time window in milliseconds
 * @param {number} options.max        — max requests per window
 * @param {string} options.keyPrefix  — Redis key namespace
 * @param {string} options.message    — error message on limit exceeded
 */
const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes default
  max = 20,
  keyPrefix = "rl",
  message = "Too many requests. Please slow down and try again later.",
} = {}) => {
  return async (req, res, next) => {
    try {
      const redis = getRedis();

      // Key: <prefix>:<ip>:<route>
      const identifier = req.ip || req.connection.remoteAddress || "unknown";
      const route = req.path.replace(/\//g, "_");
      const redisKey = `${keyPrefix}:${identifier}:${route}`;

      const windowSeconds = Math.ceil(windowMs / 1000);

      // Atomic increment + set TTL on first request
      const current = await redis.incr(redisKey);

      if (current === 1) {
        await redis.expire(redisKey, windowSeconds);
      }

      const ttl = await redis.ttl(redisKey);

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - current));
      res.setHeader("X-RateLimit-Reset", Date.now() + ttl * 1000);

      if (current > max) {
        res.setHeader("Retry-After", ttl);
        return next(new AppError(message, 429));
      }

      next();
    } catch (err) {
      // If Redis is down, fail open (don't block legitimate traffic)
      console.error("Rate limiter Redis error (failing open):", err.message);
      next();
    }
  };
};

// ─── Pre-configured limiters ───

const authRateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 20,
  keyPrefix: "rl:auth",
  message: "Too many auth attempts. Please try again later.",
});

const onboardRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyPrefix: "rl:onboard",
  message: "Too many onboarding attempts. Please try again in an hour.",
});

module.exports = { createRateLimiter, authRateLimiter, onboardRateLimiter };