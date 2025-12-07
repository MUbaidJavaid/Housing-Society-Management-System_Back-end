// src/middleware/requestLogger.ts
import { NextFunction, Request, Response } from 'express';
import { AppLogger } from '../core/logger';

const logger = new AppLogger('RequestLogger');

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  // Log request
  logger.info('Request received', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Response sent', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
    });
  });

  next();
};
