import { logger } from '../logger';
import {
  closeRedisConnection,
  createRedisClient,
  executeRedisCommand,
  testRedisConnection,
} from './redis';

import { RouteRateLimitConfig } from './types';

// Initialize rate limiter
export function initializeRateLimiter() {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;

  if (!redisUrl && !redisHost) {
    logger.warn('Redis not configured - using mock Redis for rate limiting');
    console.log('⚠️ Redis not configured - using in-memory rate limiting');
    createRedisClient(); // Sets mock client so getRedisClient() works
    return;
  }

  // Check if trying to connect to localhost in production
  if (process.env.NODE_ENV === 'production') {
    const isLocalhost = redisHost === 'localhost' || (redisUrl && redisUrl.includes('localhost'));

    if (isLocalhost) {
      logger.warn('Cannot connect to localhost Redis in production');
      console.log('⚠️ Localhost Redis detected in production - using mock/in-memory rate limiting');
      createRedisClient({ useMock: true });
      return;
    }
  }

  console.log('🔧 Attempting to initialize Redis with:', {
    hasRedisUrl: !!redisUrl,
    hasRedisHost: !!redisHost,
    url: redisUrl ? `${redisUrl.substring(0, 20)}...` : undefined,
    host: redisHost,
  });
  try {
    // Create Redis client with timeout
    const client = createRedisClient();

    // Set up connection timeout
    const connectionTimeout = setTimeout(() => {
      logger.warn('Redis connection timeout - using fallback mode');
      console.log('⚠️ Redis connection timeout - rate limiting may use memory store');
    }, 10000);

    client.on('connect', () => {
      clearTimeout(connectionTimeout);
      logger.info('Redis client connected');

      // Test connection immediately
      setTimeout(async () => {
        try {
          const isConnected = await testRedisConnection();
          if (isConnected) {
            logger.info('Redis connection test passed');
          } else {
            logger.warn('Redis connection test failed - using memory store fallback');
          }
        } catch (error) {
          logger.warn('Redis test failed:', error);
        }
      }, 1000);
    });

    client.on('error', (error: any) => {
      clearTimeout(connectionTimeout);
      logger.warn('Redis connection error:', error.message);
      console.log('⚠️ Redis connection failed - using memory store for rate limiting');
    });

    // Setup cleanup on exit
    setupCleanup();
  } catch (error) {
    logger.warn('Failed to initialize Redis rate limiter, using memory store:', error);
    console.log('⚠️ Using memory store for rate limiting (Redis failed)');
  }
}

// Setup cleanup on process exit
// function setupCleanup() {
//   const cleanup = async () => {
//     logger.info('Closing Redis connection...');
//     await closeRedisConnection();
//   };

//   process.on('SIGTERM', cleanup);
//   process.on('SIGINT', cleanup);
//   process.on('beforeExit', cleanup);
// }
let cleanupInProgress = false;

// Setup cleanup on process exit
function setupCleanup() {
  const cleanup = async () => {
    if (cleanupInProgress) {
      return;
    }

    cleanupInProgress = true;
    logger.info('Closing Redis connection...');

    try {
      await closeRedisConnection();
    } catch (error) {
      logger.error('Error during cleanup:', error);
    } finally {
      cleanupInProgress = false;
    }
  };

  // Only register once
  if (!process.listeners('SIGTERM').includes(cleanup)) {
    process.on('SIGTERM', cleanup);
  }

  if (!process.listeners('SIGINT').includes(cleanup)) {
    process.on('SIGINT', cleanup);
  }

  // Remove beforeExit handler as it can cause issues in Render
  // process.on('beforeExit', cleanup);
}
// Default route configurations
export const defaultRouteConfigs: RouteRateLimitConfig[] = [
  // Auth endpoints - stricter limits
  {
    path: '/health',
    method: 'GET',
    strategy: 'fixed-window',
    scope: 'ip',
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute
  },

  {
    path: '/api/v1/auth/register',
    method: 'POST',
    strategy: 'fixed-window',
    scope: 'ip',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations per hour per IP
    message: 'Too many registration attempts. Please try again later.',
  },
  {
    path: '/api/v1/auth/login',
    method: 'POST',
    strategy: 'sliding-window',
    scope: 'ip-user-combined',
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per 15 minutes
    message: 'Too many login attempts. Please try again later.',
  },
  {
    path: '/api/v1/auth/forgot-password',
    method: 'POST',
    strategy: 'fixed-window',
    scope: 'ip',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset requests per hour
    message: 'Too many password reset requests. Please try again later.',
  },

  // Public API endpoints - moderate limits
  {
    path: '/api/v1/public/*',
    method: 'ALL',
    strategy: 'sliding-window',
    scope: 'ip',
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute per IP
  },

  // User endpoints - user-based limits
  {
    path: '/api/v1/users/*',
    method: ['GET', 'POST', 'PUT', 'DELETE'],
    strategy: 'token-bucket',
    scope: 'user',
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per user
  },

  // Admin endpoints - higher limits
  {
    path: '/api/v1/admin/*',
    method: 'ALL',
    strategy: 'fixed-window',
    scope: 'user',
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute for admins
  },

  // File upload endpoints - stricter limits
  {
    path: '/api/v1/upload',
    method: 'POST',
    strategy: 'leaky-bucket',
    scope: 'ip-user-combined',
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 uploads per 5 minutes
    message: 'Too many upload requests. Please wait before uploading more files.',
  },

  // Search endpoints - moderate limits
  {
    path: '/api/v1/search',
    method: 'GET',
    strategy: 'sliding-window',
    scope: 'ip',
    windowMs: 10 * 1000, // 10 seconds
    max: 20, // 20 search requests per 10 seconds
  },
];

// Get rate limit configuration for environment
export function getRateLimitConfigs(): RouteRateLimitConfig[] {
  const baseConfigs = [...defaultRouteConfigs];

  // Adjust based on environment
  const env = process.env.NODE_ENV || 'development';

  if (env === 'development') {
    // More lenient limits in development
    baseConfigs.forEach(config => {
      config.max = (config.max || 100) * 10; // 10x higher limits
    });
  } else if (env === 'test') {
    // Very high limits for testing
    baseConfigs.forEach(config => {
      config.max = 10000; // Very high limit for testing
    });
  }

  // Apply custom configurations from environment
  if (process.env.RATE_LIMIT_CONFIGS) {
    try {
      const customConfigs = JSON.parse(process.env.RATE_LIMIT_CONFIGS);
      baseConfigs.push(...customConfigs);
    } catch (error) {
      logger.error('Failed to parse custom rate limit configs:', error);
    }
  }

  return baseConfigs;
}

// Rate limiter statistics
export async function getRateLimiterStats() {
  try {
    // Get all rate limit keys
    const keys = await executeRedisCommand<string[]>('keys', 'rate-limit:*');

    const stats = {
      totalKeys: keys.length,
      byType: {} as Record<string, number>,
      byPrefix: {} as Record<string, number>,
    };

    // Analyze keys
    keys.forEach(key => {
      // Extract type from key
      const parts = key.split(':');
      const type = parts[1] || 'unknown';
      const prefix = parts[0] || 'unknown';

      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.byPrefix[prefix] = (stats.byPrefix[prefix] || 0) + 1;
    });

    // Get memory usage
    const memoryInfo = await executeRedisCommand<string>('info', 'memory');
    const memoryLines = memoryInfo.split('\n');
    const usedMemory = memoryLines.find(line => line.startsWith('used_memory:'))?.split(':')[1];

    return {
      ...stats,
      memoryUsage: usedMemory ? parseInt(usedMemory) : 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to get rate limiter stats:', error);
    return null;
  }
}

// Reset rate limits for specific key pattern
export async function resetRateLimit(pattern: string): Promise<number> {
  try {
    const keys = await executeRedisCommand<string[]>('keys', pattern);

    if (keys.length === 0) {
      return 0;
    }

    const deleted = await executeRedisCommand<number>('del', ...keys);

    logger.info(`Reset ${deleted} rate limit keys for pattern: ${pattern}`);

    return deleted;
  } catch (error) {
    logger.error('Failed to reset rate limits:', error);
    return 0;
  }
}
export * from './middleware';
export * from './redis';
export * from './strategies';
export * from './types';
