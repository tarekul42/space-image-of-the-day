import { MongoClient, Db } from "mongodb";
import { env } from "./env.js";
import logger from "../utils/logger.js";

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Initialize MongoDB connection.
 * If MONGO_URI is not provided, this will simply return null.
 */
export const connectMongo = async (): Promise<Db | null> => {
  if (!env.MONGO_URI) {
    logger.warn("⚠️ MONGO_URI missing, database storage will be unavailable.");
    return null;
  }

  if (db) return db;

  try {
    client = new MongoClient(env.MONGO_URI);
    await client.connect();
    db = client.db("space-images");
    logger.info("📡 Connected to MongoDB - Premium storage activated.");
    return db;
  } catch (err) {
    logger.error(err instanceof Error ? err : { err }, "❌ MongoDB connection failed");
    return null;
  }
};

export const getDb = (): Db | null => db;
