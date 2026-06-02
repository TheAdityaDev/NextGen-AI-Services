const Redis = require("ioredis");

let redisClient = null;

const connectRedis = () => {
  const client = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 2000);
      return delay;
    },
    lazyConnect: false,
  });

  client.on("connect", () => {
    // 
  });

  client.on("error", (err) => {
    // console.error("❌ Redis error:", err.message);
  });

  client.on("reconnecting", () => {
    // console.warn("⚠️  Redis reconnecting...");
  });

  redisClient = client;
  return client;
};

const getRedis = () => {
  if (!redisClient) {
    throw new Error("Redis client not initialized. Call connectRedis() first.");
  }
  return redisClient;
};

module.exports = { connectRedis, getRedis };