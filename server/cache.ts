import Redis from "ioredis";
import { log } from "./logger";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect: true,
});

redis.on("error", (err) => log.error("Redis error", err));
redis.on("connect", () => log.info("Redis connected"));
redis.on("disconnect", () => log.info("Redis disconnected"));

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      log.error("Redis set error", err);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err) {
      log.error("Redis del error", err);
    }
  },

  async invalidateUser(userId: string): Promise<void> {
    try {
      const keys = await redis.keys(`user:${userId}:*`);
      if (keys.length > 0) await redis.del(...keys);
    } catch (err) {
      log.error("Redis invalidateUser error", err);
    }
  },
};

// Cache key helpers
export const cacheKeys = {
  userEmails: (userId: string, page: number) => `user:${userId}:emails:${page}`,
  userAnalytics: (userId: string) => `user:${userId}:analytics`,
  userPreferences: (userId: string) => `user:${userId}:preferences`,
  emailSummary: (emailId: string) => `email:${emailId}:summary`,
};

export default redis;
