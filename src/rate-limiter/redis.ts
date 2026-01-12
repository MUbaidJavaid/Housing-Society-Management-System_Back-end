import console from 'console';
import Redis from 'ioredis';
import { logger } from '../logger';

// Redis client instance
let redisClient: Redis | null = null;
let redisConnectionAttempts = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Default Redis configuration
// const defaultRedisConfig = {
//   host: process.env.REDIS_HOST || 'localhost',
//   port: parseInt(process.env.REDIS_PORT || '6379'),
//   password: process.env.REDIS_PASSWORD,
//   db: parseInt(process.env.REDIS_DB || '0'),
//   keyPrefix: process.env.REDIS_KEY_PREFIX || 'rate-limit:',
//   enableReadyCheck: true,
//   maxRetriesPerRequest: 3,
//   retryStrategy: (times: number) => {
//     const delay = Math.min(times * 1000, 10000);
//     return delay;
//   },
// };
const defaultRedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'rate-limit:',
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,

  // Render پر Redis SSL کی ضرورت ہوتی ہے
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,

  // Render کے لیے درست retry strategy
  retryStrategy: (times: number) => {
    if (times > 10) {
      return null; // Stop retrying after 10 attempts
    }
    return Math.min(times * 1000, 10000);
  },
};
// Create Redis client
export function createRedisClient(config?: Partial<typeof defaultRedisConfig>) {
  // Check if Redis should be used
  const shouldUseRedis = process.env.REDIS_URL || process.env.REDIS_HOST;

  if (!shouldUseRedis) {
    console.log('🚫 Redis not configured - using mock Redis client');

    // Return a mock client that doesn't try to connect
    const mockClient = {
      status: 'ready',
      on: (event: string, callback: Function) => {
        if (event === 'connect') {
          setTimeout(() => callback(), 10);
        }
        return mockClient;
      },
      ping: async () => 'PONG',
      get: async (_key: string) => null,
      set: async (_key: string, _value: string) => 'OK',
      incr: async (_key: string) => 1,
      expire: async (_key: string, _seconds: number) => 1,
      quit: async () => {
        console.log('Mock Redis connection closed');
        return 'OK';
      },
      keys: async () => [],
      del: async () => 0,
      ttl: async () => -2,
      zadd: async () => 0,
      zremrangebyscore: async () => 0,
      zcard: async () => 0,
      zrange: async () => [],
      // Add all methods used in strategies.ts
    } as any;

    redisClient = mockClient;
    return redisClient;
  }
  const finalConfig = { ...defaultRedisConfig, ...config };

  try {
    redisClient = new Redis(finalConfig);

    // Event listeners
    redisClient.on('connect', () => {
      logger.info('Redis client connected', {
        host: finalConfig.host,
        port: finalConfig.port,
        db: finalConfig.db,
      });
      redisConnectionAttempts = 0;
    });

    redisClient.on('error', error => {
      logger.error('Redis client error:', error.message);
    });

    redisClient.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    redisClient.on('reconnecting', (delay: any) => {
      logger.info(`Redis client reconnecting in ${delay}ms`);
    });

    redisClient.on('end', () => {
      logger.warn('Redis client connection ended');
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to create Redis client:', error);
    throw error;
  }
}

// Get Redis client (singleton)
export function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call createRedisClient first.');
  }
  return redisClient;
}

// Check if Redis is connected
export function isRedisConnected(): boolean {
  return redisClient?.status === 'ready';
}

// Test Redis connection
export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis connection test failed:', error);
    return false;
  }
}

// Close Redis connection
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    } finally {
      redisClient = null;
    }
  }
}

// Execute Redis command with retry
export async function executeRedisCommand<T>(command: string, ...args: any[]): Promise<T> {
  const client = getRedisClient();

  try {
    return await (client as any)[command](...args);
  } catch (error) {
    logger.error(`Redis command failed: ${command}`, error);

    // Attempt reconnection if needed
    if (!isRedisConnected() && redisConnectionAttempts < MAX_RETRIES) {
      redisConnectionAttempts++;
      logger.info(`Attempting Redis reconnection (${redisConnectionAttempts}/${MAX_RETRIES})`);

      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return executeRedisCommand(command, ...args);
    }

    throw error;
  }
}

// Redis utility functions for rate limiting
export async function incrementKey(key: string, windowMs: number): Promise<number> {
  const currentTime = Date.now();
  const windowKey = `${key}:${Math.floor(currentTime / windowMs)}`;

  const count = await executeRedisCommand<number>('incr', windowKey);

  // Set expiry if this is the first increment
  if (count === 1) {
    await executeRedisCommand('pexpire', windowKey, windowMs);
  }

  return count;
}

export async function getRemainingRequests(
  key: string,
  maxRequests: number,
  _windowMs: number
): Promise<number> {
  try {
    const windowKey = `${key}:window`;

    // Redis GET returns string | null, so handle both cases
    const countResult = await executeRedisCommand<string | null>('get', windowKey);

    // Convert string to number, default to 0 if null or invalid
    const count = countResult ? parseInt(countResult, 10) : 0;

    // Ensure count is a valid number
    const parsedCount = isNaN(count) ? 0 : count;

    return Math.max(0, maxRequests - parsedCount);
  } catch (error) {
    logger.error('Error getting remaining requests:', error);
    return maxRequests; // Fallback: assume no requests used
  }
}

export async function getResetTime(_key: string, windowMs: number): Promise<number> {
  const currentTime = Date.now();
  const currentWindow = Math.floor(currentTime / windowMs);
  const nextWindow = currentWindow + 1;
  return nextWindow * windowMs;
}

// Clean up expired rate limit keys
export async function cleanupExpiredKeys(prefix: string = 'rate-limit:'): Promise<number> {
  try {
    const client = getRedisClient();
    const keys = await client.keys(`${prefix}*`);
    let deletedCount = 0;

    for (const key of keys) {
      const ttl = await client.ttl(key);
      if (ttl === -2 || ttl === -1) {
        // Key expired or has no expiry
        await client.del(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.debug(`Cleaned up ${deletedCount} expired rate limit keys`);
    }

    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired rate limit keys:', error);
    return 0;
  }
}
