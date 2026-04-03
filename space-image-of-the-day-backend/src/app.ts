import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import router from "./app/route/index.js";
import logger from "./app/utils/logger.js";

const app: Application = express();

/**
 * Standard Security & Performance Middlewares
 */
app.use(helmet());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`✨ Incoming signal on [${req.method}] ${req.path}`);
  next();
});

/**
 * Rate Limiting
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "🌌 Too many signals from this sector. Please wait.",
});
app.use("/api", limiter);

/**
 * API Routes
 */
app.use("/api/v1", router);

/**
 * Root Route
 */
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "🌌 Welcome to the Space Image of the Day API!",
    version: "1.0.0",
    endpoints: {
      apod: "/api/v1/apod",
      health: "/health",
    },
  });
});

/**
 * Health Check
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    service: "Space Image of the Day API",
  });
});

/**
 * 404 Not Found Handling
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "🚀 Path not found in this galaxy.",
  });
});

/**
 * Global Error Handler
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || 500;
  const message = err.message || "Internal Starship Error";

  logger.error(err as Error, `Error: ${message}`);

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export default app;
