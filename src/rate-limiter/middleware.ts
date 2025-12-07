import { NextFunction, Request, Response } from 'express';
import { logger } from '../logger';
import { getStrategyFunction } from './strategies';
import {
  RateLimitConfig,
  RateLimitResult,
  RateLimitScope,
  RateLimitStrategy,
  RouteRateLimitConfig,
} from './types';

// Default rate limit configuration
const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later.',
  statusCode: 429,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

// Generate rate limit key based on scope
export function generateRateLimitKey(
  req: Request,
  scope: RateLimitScope = 'ip',
  prefix: string = 'rate-limit'
): string {
  let key = prefix;

  switch (scope) {
    case 'ip':
      key += `:ip:${req.ip}`;
      break;

    case 'user':
      const userId = (req as any).user?.id || 'anonymous';
      key += `:user:${userId}`;
      break;

    case 'global':
      key += ':global';
      break;

    case 'endpoint':
      key += `:endpoint:${req.method}:${req.path}`;
      break;

    case 'ip-user-combined':
      const user = (req as any).user?.id || 'anonymous';
      key += `:combined:${req.ip}:${user}`;
      break;

    default:
      key += `:ip:${req.ip}`;
  }

  // Normalize key (remove special characters, limit length)
  return key.replace(/[^a-zA-Z0-9:_\-.]/g, '-').substring(0, 255);
}

// Check if request should be skipped
export function shouldSkipRateLimit(req: Request, config: RateLimitConfig): boolean {
  // Check custom skip function
  if (config.skip && config.skip(req)) {
    return true;
  }

  // Skip successful requests if configured
  if (config.skipSuccessfulRequests && req.method === 'GET') {
    return true;
  }

  // Skip based on user role (example)
  const user = (req as any).user;
  if (user && user.role === 'admin') {
    return true;
  }

  // Skip health checks and monitoring endpoints
  if (req.path.startsWith('/health') || req.path === '/ping') {
    return true;
  }

  return false;
}

// Apply rate limiting
export async function applyRateLimit(
  req: Request,
  config: Partial<RateLimitConfig> = {},
  strategy: RateLimitStrategy = 'fixed-window',
  scope: RateLimitScope = 'ip'
): Promise<RateLimitResult> {
  const finalConfig = { ...defaultConfig, ...config };

  // Skip rate limiting if configured
  if (shouldSkipRateLimit(req, finalConfig)) {
    return {
      success: true,
      limit: finalConfig.max,
      remaining: finalConfig.max,
      reset: Date.now() + finalConfig.windowMs,
    };
  }

  // Generate rate limit key
  const key = generateRateLimitKey(req, scope);

  // Get strategy function
  const strategyFn = getStrategyFunction(strategy);

  try {
    // Apply rate limiting strategy
    const result = await strategyFn(key, finalConfig.windowMs, finalConfig.max);

    // Log rate limit events
    if (!result.success) {
      logger.warn('Rate limit exceeded', {
        key,
        ip: req.ip,
        method: req.method,
        path: req.path,
        userId: (req as any).user?.id,
        limit: result.limit,
        remaining: result.remaining,
        retryAfter: result.retryAfter,
      });

      // Call onLimitReached callback
      if (finalConfig.onLimitReached) {
        finalConfig.onLimitReached(req);
      }
    }

    return result;
  } catch (error) {
    logger.error('Rate limiting error:', error);

    // If Redis fails, allow the request (fail-open)
    return {
      success: true,
      limit: finalConfig.max,
      remaining: finalConfig.max,
      reset: Date.now() + finalConfig.windowMs,
    };
  }
}

// Get rate limit headers
export function getRateLimitHeaders(result: RateLimitResult) {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

// Express middleware factory
export function createRateLimitMiddleware(
  config: Partial<RateLimitConfig> = {},
  strategy: RateLimitStrategy = 'fixed-window',
  scope: RateLimitScope = 'ip'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await applyRateLimit(req, config, strategy, scope);

      // Add rate limit headers to response
      const headers = getRateLimitHeaders(result);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Check if rate limit is exceeded
      if (!result.success) {
        res.status(config.statusCode || 429).json({
          success: false,
          error: {
            type: 'RATE_LIMIT_ERROR',
            message: config.message || 'Too many requests, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: result.retryAfter,
            limit: result.limit,
            reset: new Date(result.reset).toISOString(),
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          requestId: (req as any).id,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      next(); // Fail open - allow request through
    }
  };
}

// Multi-scope rate limiting
export function createMultiScopeRateLimit(
  configs: Array<{
    config: Partial<RateLimitConfig>;
    strategy?: RateLimitStrategy;
    scope: RateLimitScope;
  }>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const results: RateLimitResult[] = [];
    let shouldBlock = false;
    let finalResult: RateLimitResult | null = null;

    try {
      // Apply all rate limit scopes
      for (const { config, strategy = 'fixed-window', scope } of configs) {
        const result = await applyRateLimit(req, config, strategy, scope);
        results.push(result);

        if (!result.success) {
          shouldBlock = true;
          finalResult = result;
          break;
        }
      }

      // Use the most restrictive headers
      const mostRestrictive = results.reduce((prev, current) => {
        if (current.remaining < prev.remaining) return current;
        if (current.reset < prev.reset) return current;
        return prev;
      });

      // Add headers
      const headers = getRateLimitHeaders(mostRestrictive);
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Block if any rate limit is exceeded
      if (shouldBlock && finalResult) {
        res.status(finalResult.limit || 429).json({
          success: false,
          error: {
            type: 'RATE_LIMIT_ERROR',
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: finalResult.retryAfter,
            limit: finalResult.limit,
            reset: new Date(finalResult.reset).toISOString(),
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          requestId: (req as any).id,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Multi-scope rate limit error:', error);
      next(); // Fail open
    }
  };
}

// Route-specific rate limiting
export function createRouteRateLimit(routes: RouteRateLimitConfig[]) {
  const routeMap = new Map<string, RouteRateLimitConfig>();

  // Build route map for fast lookup
  routes.forEach(route => {
    const method = Array.isArray(route.method)
      ? route.method.map(m => m.toUpperCase()).join('|')
      : route.method?.toUpperCase() || 'ALL';

    const key = `${method}:${route.path}`;
    routeMap.set(key, route);
  });

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Check if this route has specific rate limiting
    const exactKey = `${req.method}:${req.path}`;
    const wildcardKey = `ALL:${req.path}`;

    const routeConfig = routeMap.get(exactKey) || routeMap.get(wildcardKey);

    if (routeConfig) {
      const middleware = createRateLimitMiddleware(
        {
          windowMs: routeConfig.windowMs || 15 * 60 * 1000,
          max: routeConfig.max || 100,
          message: routeConfig.message,
          statusCode: routeConfig.statusCode,
        },
        routeConfig.strategy || 'fixed-window',
        routeConfig.scope || 'ip'
      );

      middleware(req, res, next);
      return;
    }

    next();
  };
}

// Dynamic rate limiting based on load
export function createAdaptiveRateLimit(
  baseConfig: Partial<RateLimitConfig>,
  getLoadFactor: () => number // 0-1 where 1 is max load
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const loadFactor = getLoadFactor();

    // Adjust rate limit based on load
    const adjustedConfig = { ...baseConfig };

    if (loadFactor > 0.8) {
      // High load - stricter rate limiting
      adjustedConfig.max = Math.floor((baseConfig.max || 100) * 0.5);
      adjustedConfig.windowMs = (baseConfig.windowMs || 900000) * 2;
    } else if (loadFactor > 0.5) {
      // Medium load - moderate rate limiting
      adjustedConfig.max = Math.floor((baseConfig.max || 100) * 0.75);
    }

    const middleware = createRateLimitMiddleware(adjustedConfig);
    return middleware(req, res, next);
  };
}
