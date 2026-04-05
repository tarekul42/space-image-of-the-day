import { Server } from "http";
import app from "./app.js";
import { env } from "./app/config/env.js";
import redisClient from "./app/config/redis.config.js";
import logger from "./app/utils/logger.js";
import { StorageService } from "./app/services/storage.service.js";

let server: Server;

async function bootstrap() {
  try {
    // 1. Connect to Redis (fast cache)
    await redisClient.connect();
    logger.info("✅ Initialized Redis connection");

    // 2. Connect to Database (robust persistence)
    await StorageService.init();

    // Start Server
    server = app.listen(env.PORT, () => {
      logger.info(`🚀 [SERVER] Application is running on port ${env.PORT}`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error(
      err instanceof Error ? err : { err },
      "❌ Failed to bootstrap the server",
    );
    process.exit(1);
  }

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        logger.info("⚠️ Server closed");
      });
    }
    process.exit(1);
  };

  const unexpectedErrorHandler = (error: unknown) => {
    logger.error(
      error instanceof Error ? error : { error },
      "💥 Unexpected Error",
    );
    exitHandler();
  };

  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);

  process.on("SIGTERM", () => {
    logger.info("🛑 SIGTERM received");
    if (server) {
      server.close();
    }
  });
}

bootstrap();
