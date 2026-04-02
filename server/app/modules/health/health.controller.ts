import { Request, Response } from 'express';

/**
 * Health Check Controller
 * GET /api/health
 */
export const checkHealth = (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Space Image of the Day API',
    timestamp: new Date().toISOString(),
    database: (global as any).apodCache?._model ? 'connected' : 'in-memory-cache',
    uptime: process.uptime(),
  });
};
