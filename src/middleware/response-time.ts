import { NextFunction, Request, Response } from 'express';
import logger from '../core/logger';

// Store response times for monitoring
const responseTimes: number[] = [];
const maxSamples = 1000; // Keep last 1000 samples
const bootTime = Date.now();
let totalRequests = 0;
const statusClassCounts = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };

type RecentRequest = {
  method: string;
  path: string;
  status: number;
  duration: number;
  at: string;
};

const recentRequests: RecentRequest[] = [];
const maxRecent = 18;

function classifyStatus(code: number): keyof typeof statusClassCounts {
  if (code >= 500) return '5xx';
  if (code >= 400) return '4xx';
  if (code >= 300) return '3xx';
  return '2xx';
}

function safePath(url: string): string {
  try {
    return decodeURIComponent(url.split('?')[0] || '/').slice(0, 120);
  } catch {
    return '/';
  }
}

/**
 * Response time monitoring middleware
 */
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    totalRequests += 1;
    statusClassCounts[classifyStatus(res.statusCode)] += 1;

    // Store response time
    responseTimes.push(duration);
    if (responseTimes.length > maxSamples) {
      responseTimes.shift();
    }

    recentRequests.push({
      method: req.method,
      path: safePath(req.originalUrl || req.url),
      status: res.statusCode,
      duration,
      at: new Date().toISOString(),
    });
    if (recentRequests.length > maxRecent) {
      recentRequests.shift();
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

export const getApiTrafficStats = () => {
  const elapsedMs = Math.max(Date.now() - bootTime, 1);
  const elapsedMin = elapsedMs / 60000;
  const latency = getResponseTimeStats();

  return {
    totalRequests,
    requestsPerMinute: totalRequests / elapsedMin,
    status: { ...statusClassCounts },
    errorRate:
      totalRequests === 0 ? 0 : ((statusClassCounts['4xx'] + statusClassCounts['5xx']) / totalRequests) * 100,
    latency,
    sparkline: responseTimes.slice(-40),
    recent: [...recentRequests].reverse(),
  };
};

/**
 * Reset response time statistics
 */
export const resetResponseTimeStats = () => {
  responseTimes.length = 0;
  recentRequests.length = 0;
  totalRequests = 0;
  statusClassCounts['2xx'] = 0;
  statusClassCounts['3xx'] = 0;
  statusClassCounts['4xx'] = 0;
  statusClassCounts['5xx'] = 0;
};
