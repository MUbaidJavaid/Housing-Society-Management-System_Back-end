import { NextFunction, Request, Response } from 'express';
import logger from '../core/logger';

// Store response times for monitoring
const responseTimes: number[] = [];
const maxSamples = 1000; // Keep last 1000 samples

/**
 * Response time monitoring middleware
 */
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Store response time
    responseTimes.push(duration);
    if (responseTimes.length > maxSamples) {
      responseTimes.shift();
    }

    // Log slow requests
    if (duration > 1000) {
      // More than 1 second
      logger.warn(`Slow request detected: ${req.method} ${req.url} - ${duration}ms`, {
        method: req.method,
        url: req.url,
        duration,
        status: res.statusCode,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      });
    }
  });

  next();
};

/**
 * Get response time statistics
 */
export const getResponseTimeStats = () => {
  if (responseTimes.length === 0) {
    return null;
  }

  const sorted = [...responseTimes].sort((a, b) => a - b);

  return {
    samples: responseTimes.length,
    average: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p90: sorted[Math.floor(sorted.length * 0.9)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    recent: responseTimes.slice(-10), // Last 10 samples
  };
};

/**
 * Reset response time statistics
 */
export const resetResponseTimeStats = () => {
  responseTimes.length = 0;
};
