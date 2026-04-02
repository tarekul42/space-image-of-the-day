import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import connectDB from './app/config/db.js';
import { initCache } from './app/utils/cache.js';
import errorHandler from './app/middleware/errorHandler.js';

// Import routes
import apodRoutes from './app/modules/apod/apod.route.js';
import healthRoutes from './app/modules/health/health.route.js';

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Database & Cache Setup
const startApp = async () => {
  try {
    const isDBConnected = await connectDB();
    initCache(isDBConnected);

    // 2. Standard Middleware
    app.use(cors());
    app.use(express.json());

    // 3. API Routes
    app.use('/api/apod', apodRoutes);
    app.use('/api/health', healthRoutes);

    // 4. Global Error Handling
    app.use(errorHandler);

    // 5. Server Start
    app.listen(PORT, () => {
      console.log(`\n╔══════════════════════════════════════════════╗`);
      console.log(`║  🚀 Space Discovery API - Modular App    ║`);
      console.log(`║  Port:   ${PORT}                               ║`);
      console.log(`║  Mode:   ${process.env.NODE_ENV || 'development'}                     ║`);
      console.log(`╚══════════════════════════════════════════════╝\n`);
    });
  } catch (error: any) {
    console.error('[Fatal Start Error]', error.message);
    process.exit(1);
  }
};

startApp();
