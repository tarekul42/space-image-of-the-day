import { createClient } from "redis";
import logger from "../utils/logger.js";
import { env } from "./env.js";

const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on("error", (err) => logger.error(err, "Redis Client Error"));
redisClient.on("connect", () => logger.info("🚀 Redis Client Connected"));

export default redisClient;
