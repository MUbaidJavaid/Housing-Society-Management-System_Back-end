import { executeRedisCommand, getResetTime, incrementKey } from './redis';
import { RateLimitResult, RateLimitStrategy } from './types';

// Fixed window counter strategy
export async function fixedWindowStrategy(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitResult> {
  const currentCount = await incrementKey(key, windowMs);
  const remaining = Math.max(0, maxRequests - currentCount);
  const reset = await getResetTime(key, windowMs);

  return {
    success: currentCount <= maxRequests,
    limit: maxRequests,
    remaining,
    reset,
    retryAfter: currentCount > maxRequests ? Math.ceil((reset - Date.now()) / 1000) : undefined,
  };
}

// Sliding window strategy using Redis sorted sets
export async function slidingWindowStrategy(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<RateLimitResult> {
  const currentTime = Date.now();
  const windowStart = currentTime - windowMs;

  // Use Redis sorted set to store request timestamps
  const redisKey = `sliding:${key}`;

  // Add current request timestamp
  await executeRedisCommand('zadd', redisKey, currentTime, currentTime);

  // Remove old requests outside the window
  await executeRedisCommand('zremrangebyscore', redisKey, 0, windowStart);

  // Count requests in the window
  const requestCount = await executeRedisCommand<number>('zcard', redisKey);

  // Set expiry on the sorted set
  await executeRedisCommand('expire', redisKey, Math.ceil(windowMs / 1000));

  const remaining = Math.max(0, maxRequests - requestCount);
 const oldestRequest = await executeRedisCommand<string[]>(
   'zrange',
   redisKey,
   '0',
   '0',
   'WITHSCORES'
 );
  const reset = oldestRequest ? parseInt(oldestRequest[1]) + windowMs : currentTime + windowMs;

  return {
    success: requestCount <= maxRequests,
    limit: maxRequests,
    remaining,
    reset,
    retryAfter: requestCount > maxRequests ? Math.ceil((reset - currentTime) / 1000) : undefined,
  };
}

// Token bucket strategy
export async function tokenBucketStrategy(
  key: string,
  windowMs: number,
  maxRequests: number,
  refillRate: number = 1 // tokens per second
): Promise<RateLimitResult> {
  const redisKey = `token:${key}`;
  const currentTime = Date.now();

  // Get current bucket state
  const bucketData = await executeRedisCommand<string>('get', redisKey);
  let tokens: number;
  let lastRefill: number;

  if (bucketData) {
    const [tokenStr, lastRefillStr] = bucketData.split(':');
    tokens = parseFloat(tokenStr);
    lastRefill = parseFloat(lastRefillStr);
  } else {
    tokens = maxRequests;
    lastRefill = currentTime;
  }

  // Calculate time passed and refill tokens
  const timePassed = (currentTime - lastRefill) / 1000;
  const tokensToAdd = timePassed * refillRate;
  tokens = Math.min(maxRequests, tokens + tokensToAdd);

  // Check if we have enough tokens
  const success = tokens >= 1;

  if (success) {
    tokens -= 1;
  }

  // Update bucket state
  await executeRedisCommand('set', redisKey, `${tokens}:${currentTime}`);
  await executeRedisCommand('expire', redisKey, Math.ceil(windowMs / 1000));

  const remaining = Math.floor(tokens);
  const reset = currentTime + (1 / refillRate) * 1000; // Time for one token to refill

  return {
    success,
    limit: maxRequests,
    remaining,
    reset,
    retryAfter: !success ? Math.ceil((1 - tokens) / refillRate) : undefined,
  };
}

// Leaky bucket strategy
export async function leakyBucketStrategy(
  key: string,
  windowMs: number,
  maxRequests: number,
  leakRate: number = 1 // requests per second
): Promise<RateLimitResult> {
  const redisKey = `leaky:${key}`;
  const currentTime = Date.now();

  // Get bucket state
  const bucketData = await executeRedisCommand<string>('get', redisKey);
  let waterLevel: number;
  let lastLeak: number;

  if (bucketData) {
    const [levelStr, lastLeakStr] = bucketData.split(':');
    waterLevel = parseFloat(levelStr);
    lastLeak = parseFloat(lastLeakStr);
  } else {
    waterLevel = 0;
    lastLeak = currentTime;
  }

  // Calculate leaked water
  const timePassed = (currentTime - lastLeak) / 1000;
  const leaked = timePassed * leakRate;
  waterLevel = Math.max(0, waterLevel - leaked);

  // Check if bucket can accept more water
  const success = waterLevel < maxRequests;

  if (success) {
    waterLevel += 1;
  }

  // Update bucket state
  await executeRedisCommand('set', redisKey, `${waterLevel}:${currentTime}`);
  await executeRedisCommand('expire', redisKey, Math.ceil(windowMs / 1000));

  const remaining = Math.floor(maxRequests - waterLevel);
  const reset = currentTime + ((waterLevel - maxRequests + 1) / leakRate) * 1000;

  return {
    success,
    limit: maxRequests,
    remaining,
    reset,
    retryAfter: !success ? Math.ceil((waterLevel - maxRequests + 1) / leakRate) : undefined,
  };
}

// Get strategy function
export function getStrategyFunction(strategy: RateLimitStrategy) {
  switch (strategy) {
    case 'sliding-window':
      return slidingWindowStrategy;
    case 'token-bucket':
      return tokenBucketStrategy;
    case 'leaky-bucket':
      return leakyBucketStrategy;
    case 'fixed-window':
    default:
      return fixedWindowStrategy;
  }
}

// Rate limiting algorithm comparison
export function compareStrategies(): Record<
  string,
  { pros: string[]; cons: string[]; bestFor: string[] }
> {
  return {
    'fixed-window': {
      pros: ['Simple to implement', 'Memory efficient', 'Predictable behavior'],
      cons: ['Burst traffic at window edges', 'Less accurate for distributed systems'],
      bestFor: ['Simple APIs', 'Low traffic endpoints', 'Internal services'],
    },
    'sliding-window': {
      pros: [
        'More accurate rate limiting',
        'Smooths burst traffic',
        'Good for distributed systems',
      ],
      cons: ['More Redis operations', 'Higher memory usage'],
      bestFor: ['Public APIs', 'High traffic endpoints', 'Payment processing'],
    },
    'token-bucket': {
      pros: ['Allows burst traffic', 'Smooth rate limiting', 'Good for streaming APIs'],
      cons: ['More complex implementation', 'Stateful'],
      bestFor: ['Streaming APIs', 'Real-time applications', 'Websocket connections'],
    },
    'leaky-bucket': {
      pros: ['Smooths traffic bursts', 'Predictable output rate', 'Queue-like behavior'],
      cons: ['Can cause delays', 'May drop requests', 'More complex'],
      bestFor: ['Message queues', 'Batch processing', 'Load balancing'],
    },
  };
}
