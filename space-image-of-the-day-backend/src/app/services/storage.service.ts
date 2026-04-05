import redisClient from "../config/redis.config.js";
import { getDb, connectMongo } from "../config/mongo.config.js";
import logger from "../utils/logger.js";
import { IApodData } from "../modules/apod/apod.interface.js";

/**
 * Unified Storage Service
 * Handles transparent fallback between Redis (fast, 30MB) and 
 * MongoDB (persistent, 512MB free) for a truly "nerd-scale" robust backend.
 */
export const StorageService = {
  /**
   * Get APOD data from cache/database.
   * Priority: Redis -> MongoDB.
   */
  async get(key: string): Promise<IApodData | null> {
    try {
      // 1. Try Redis first (fastest)
      const cached = await redisClient.get(key);
      if (cached) return JSON.parse(cached);

      // 2. Try MongoDB fallback
      const db = getDb();
      if (db) {
        const item = await db.collection<IApodData>("apods").findOne({ cacheKey: key });
        if (item) {
          logger.info(`🏛️ MongoDB Hit for: ${key}`);
          // Back-fill Redis for next fast hit
          redisClient.set(key, JSON.stringify(item), { EX: 86400 }).catch(() => {});
          return item;
        }
      }
    } catch (err) {
      logger.error(err instanceof Error ? err : { err }, "Storage.get failed");
    }
    return null;
  },

  /**
   * Save APOD data.
   * Logic: Save to MongoDB for persistence AND Redis for fast subsequent hits.
   */
  async set(key: string, data: IApodData, ttl: number = 86400): Promise<void> {
    try {
      const dataString = JSON.stringify(data);
      
      // 1. Save to Redis
      await redisClient.set(key, dataString, { EX: ttl });

      // 2. Save to MongoDB (Permanent Nerd-Store)
      const db = getDb();
      if (db) {
        await db.collection("apods").updateOne(
          { cacheKey: key },
          { $set: { ...data, cacheKey: key, updatedAt: new Date() } },
          { upsert: true }
        );
      }
    } catch (err) {
      logger.error(err instanceof Error ? err : { err }, "Storage.set failed");
    }
  },

  /**
   * Initial connection logic for server startup
   */
  async init() {
    await connectMongo();
  }
};
