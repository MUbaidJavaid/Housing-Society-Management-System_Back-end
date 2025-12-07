import { NextFunction, Request, Response } from 'express';
import { logger } from '../logger';
import {
  createAdaptiveRateLimit,
  createMultiScopeRateLimit,
  createRateLimitMiddleware,
  createRouteRateLimit,
  getRateLimitConfigs,
  getRateLimiterStats,
  initializeRateLimiter,
  resetRateLimit,
} from '../rate-limiter';

// Initialize rate limiter on import
initializeRateLimiter();

// Global rate limiting middleware
export const globalRateLimit = createRateLimitMiddleware({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests, please try again later.',
  skip: req => {
    // Skip rate limiting for certain user roles
    const user = (req as any).user;
    if (user && user.role === 'admin') {
      return true;
    }

    // Skip for internal services
    const apiKey = req.headers['x-api-key'];
    if (apiKey === process.env.INTERNAL_API_KEY) {
      return true;
    }

    return false;
  },
});

// Auth-specific rate limiting
export const authRateLimit = createMultiScopeRateLimit([
  {
    scope: 'ip',
    config: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // 20 attempts per IP
      message: 'Too many authentication attempts from this IP.',
    },
  },
  {
    scope: 'user',
    config: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 attempts per user
      message: 'Too many authentication attempts for this account.',
    },
  },
]);

// Public API rate limiting
export const publicApiRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  strategy: 'sliding-window',
  scope: 'ip',
});

// Admin API rate limiting (more generous)
export const adminRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute
  scope: 'user',
  skip: req => {
    // Only apply to admin routes
    return !req.path.startsWith('/api/v1/admin');
  },
});

// Upload rate limiting
export const uploadRateLimit = createRateLimitMiddleware({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 uploads per 5 minutes
  strategy: 'leaky-bucket',
  scope: 'ip-user-combined',
  message: 'Too many upload requests. Please wait before uploading more files.',
});

// Dynamic rate limiting based on system load
export const adaptiveRateLimit = createAdaptiveRateLimit(
  {
    windowMs: 60 * 1000,
    max: 100,
  },
  () => {
    // Calculate system load (simplified example)
    const load = process.memoryUsage().heapUsed / process.memoryUsage().heapTotal;
    return load;
  }
);

// Route-specific rate limiting based on configuration
export const routeSpecificRateLimit = createRouteRateLimit(getRateLimitConfigs());

// Rate limit info endpoint
export const rateLimitInfo = async (_req: Request, res: Response) => {
  try {
    const stats = await getRateLimiterStats();

    res.json({
      success: true,
      data: {
        enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        defaultWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        defaultMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
        redisConnected: true, // We would need a function to check this
        stats,
        routes: getRateLimitConfigs().map(config => ({
          path: config.path,
          method: config.method,
          max: config.max,
          windowMs: config.windowMs,
          strategy: config.strategy,
          scope: config.scope,
        })),
      },
    });
  } catch (error) {
    logger.error('Failed to get rate limit info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get rate limit information',
    });
  }
};

// Rate limit reset endpoint (admin only)
export const rateLimitReset = async (req: Request, res: Response) => {
  try {
    const { pattern, scope, userId, ip } = req.body;

    let resetPattern = 'rate-limit:*';

    if (pattern) {
      resetPattern = pattern;
    } else if (scope === 'user' && userId) {
      resetPattern = `rate-limit:user:${userId}:*`;
    } else if (scope === 'ip' && ip) {
      resetPattern = `rate-limit:ip:${ip}:*`;
    } else if (scope === 'all') {
      resetPattern = 'rate-limit:*';
    }

    const deletedCount = await resetRateLimit(resetPattern);

    res.json({
      success: true,
      message: `Reset ${deletedCount} rate limit entries`,
      pattern: resetPattern,
    });
  } catch (error) {
    logger.error('Failed to reset rate limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset rate limits',
    });
  }
};

// Test rate limit endpoint
export const testRateLimit = createRateLimitMiddleware({
  windowMs: 10 * 1000, // 10 seconds
  max: 3, // 3 requests per 10 seconds
  message: 'Test rate limit exceeded. Please wait 10 seconds.',
});

export const rateLimitBypass = (req: Request, res: Response, next: NextFunction) => {
  // Check for trusted API key
  const apiKey = req.headers['x-api-key'];
  const trustedKeys = process.env.TRUSTED_API_KEYS?.split(',') || [];

  // Handle apiKey which can be string, string[], or undefined
  if (apiKey) {
    // Convert to string if it's an array (take first element)
    const keyString = Array.isArray(apiKey) ? apiKey[0] : apiKey;

    if (trustedKeys.includes(keyString)) {
      logger.debug('Rate limit bypassed for trusted API key', {
        apiKey: keyString.substring(0, 8) + '...', // Now safe to call substring
        path: req.path,
      });

      // Add headers indicating bypass
      res.setHeader('X-RateLimit-Bypass', 'true');
      res.setHeader('X-RateLimit-Bypass-Reason', 'trusted-api-key');

      return next();
    }
  }

  // Check for internal network
  const internalNetworks = process.env.INTERNAL_NETWORKS?.split(',') || ['127.0.0.1', '::1'];

  // Check if req.ip exists and is a string
  const clientIp = req.ip;
  if (clientIp && internalNetworks.includes(clientIp)) {
    res.setHeader('X-RateLimit-Bypass', 'true');
    res.setHeader('X-RateLimit-Bypass-Reason', 'internal-network');
    return next();
  }

  next();
};

// Rate limit test middleware for development - MOVE THIS OUTSIDE
export const devRateLimitTest = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'development' && req.headers['x-test-rate-limit']) {
    // Make sure testRateLimit is imported/defined
    testRateLimit(req, res, next);
    return;
  }
  next();
};

// Export all middleware
export default {
  globalRateLimit,
  authRateLimit,
  publicApiRateLimit,
  adminRateLimit,
  uploadRateLimit,
  adaptiveRateLimit,
  routeSpecificRateLimit,
  rateLimitInfo,
  rateLimitReset,
  testRateLimit,
  rateLimitBypass,
  devRateLimitTest, // Now this exists
};
