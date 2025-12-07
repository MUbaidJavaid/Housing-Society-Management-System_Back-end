// src/health/middleware/health.middleware.ts
import { NextFunction, Request, Response } from 'express';
import logger from '../../core/logger';
import { healthCheckSystem } from '../index'; // یہ صحیح import ہے

/**
 * Health check middleware for critical routes
 * Returns 503 if service is unhealthy
 */
export const requireHealthy = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const healthResponse = await healthCheckSystem.runAllChecks();

    if (healthResponse.status === 'unhealthy') {
      logger.warn(`Blocking request to ${req.method} ${req.url} due to unhealthy service`);

      // Check if headers are already sent
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          error: 'Service is currently unavailable',
          code: 'SERVICE_UNAVAILABLE',
          health: {
            status: healthResponse.status,
            timestamp: healthResponse.timestamp,
            unhealthyChecks: Object.entries(healthResponse.checks)
              .filter(([_, check]) => check.status === 'unhealthy')
              .map(([name, check]) => ({ name, error: check.error })),
          },
        });
      }
      return;
    }

    next();
  } catch (error) {
    logger.error('Health check middleware error:', error);
    next(); // Allow request to proceed if health check fails
  }
};

/**
 * Add health headers to responses
 * FIXED: Check if headers are already sent before setting them
 */
export const healthHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Only add headers if they haven't been sent yet
  if (!res.headersSent) {
    // Add health-related headers
    res.setHeader('X-Service-Status', 'operational');
    res.setHeader('X-Service-Version', process.env.npm_package_version || '1.0.0');
    res.setHeader('X-Service-Environment', process.env.NODE_ENV || 'development');

    // Add request timing
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      // Check again before setting finish-time header
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${duration}ms`);
      }
    });
  }

  next();
};

/**
 * Graceful shutdown middleware
 * Stops accepting new requests during shutdown
 * FIXED: Check if headers are already sent
 */
export const gracefulShutdown = (shutdownInProgress: boolean) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (shutdownInProgress) {
      logger.warn('Server is shutting down - rejecting request', {
        method: req.method,
        url: req.url,
      });

      // Check if headers are already sent
      if (!res.headersSent) {
        res.setHeader('Connection', 'close');
        res.status(503).json({
          success: false,
          error: 'Service is shutting down',
          code: 'SHUTDOWN_IN_PROGRESS',
          message: 'Please try again later',
          retryAfter: 30,
        });
      }
      return;
    }

    next();
  };
};

/**
 * Circuit breaker middleware for external dependencies
 * FIXED: Check if headers are already sent
 */
export const circuitBreaker = (
  dependencyName: string,
  options: {
    failureThreshold: number;
    resetTimeout: number;
    halfOpenMaxRequests: number;
  } = {
    failureThreshold: 5,
    resetTimeout: 30000,
    halfOpenMaxRequests: 3,
  }
) => {
  const state = {
    failures: 0,
    lastFailure: 0,
    state: 'closed' as 'closed' | 'open' | 'half-open',
    halfOpenSuccesses: 0,
  };

  return (_req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();

    // Check if circuit is open
    if (state.state === 'open') {
      if (now - state.lastFailure > options.resetTimeout) {
        state.state = 'half-open';
        state.halfOpenSuccesses = 0;
      } else {
        // Check if headers are already sent
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            error: `Service dependency ${dependencyName} is unavailable`,
            code: 'CIRCUIT_BREAKER_OPEN',
            retryAfter: Math.ceil((state.lastFailure + options.resetTimeout - now) / 1000),
          });
        }
        return;
      }
    }

    // Store original end method
    const originalEnd = res.end;

    // Override end method to track failures
    res.end = function (...args: any[]) {
      if (res.statusCode >= 500) {
        handleFailure();
      } else {
        handleSuccess();
      }

      return originalEnd.apply(this, args as any);
    };

    function handleFailure() {
      state.failures++;

      if (state.state === 'half-open') {
        // Half-open state failed, go back to open
        state.state = 'open';
        state.lastFailure = now;
      } else if (state.failures >= options.failureThreshold) {
        // Closed state reached threshold, open circuit
        state.state = 'open';
        state.lastFailure = now;
        logger.warn(`Circuit breaker opened for ${dependencyName}`);
      }
    }

    function handleSuccess() {
      if (state.state === 'half-open') {
        state.halfOpenSuccesses++;

        if (state.halfOpenSuccesses >= options.halfOpenMaxRequests) {
          // Successfully processed enough requests, close circuit
          state.state = 'closed';
          state.failures = 0;
          logger.info(`Circuit breaker closed for ${dependencyName}`);
        }
      } else {
        // Closed state success, reset failures
        state.failures = 0;
      }
    }

    next();
  };
};

// Track graceful shutdown
let isShuttingDown = false;

// Setup graceful shutdown
export function setupGracefulShutdown(): void {
  const gracefulShutdownHandler = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    isShuttingDown = true;

    // Wait for ongoing requests to complete
    setTimeout(() => {
      logger.info('Graceful shutdown completed');
      process.exit(0);
    }, 10000); // Wait up to 10 seconds

    // Force shutdown after 15 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 15000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdownHandler('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdownHandler('SIGINT'));
}

// Export the middleware
export default {
  gracefulShutdown: () => gracefulShutdown(isShuttingDown),
  healthHeaders,
  requireHealthy,
  setupGracefulShutdown,
};
