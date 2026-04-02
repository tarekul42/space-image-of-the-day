import { Request, Response, NextFunction } from 'express';

/**
 * Global Error Handling Middleware
 */
export default (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Middleware]', err.stack);

  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'Something went wrong on our end.',
    status: err.status || 500,
  });
};
