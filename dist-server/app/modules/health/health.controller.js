/**
 * Health Check Controller
 * GET /api/health
 */
export const checkHealth = (req, res) => {
    res.json({
        status: 'ok',
        service: 'Space Image of the Day API',
        timestamp: new Date().toISOString(),
        database: global.apodCache?._model ? 'connected' : 'in-memory-cache',
        uptime: process.uptime(),
    });
};
