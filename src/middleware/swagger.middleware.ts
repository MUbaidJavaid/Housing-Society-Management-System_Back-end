import { NextFunction, Request, Response } from 'express';
import { logger } from '../logger';

// Swagger documentation access control
export function swaggerAuth() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const swaggerPaths = ['/api-docs', '/api-docs.json'];

    if (swaggerPaths.some(path => req.path.startsWith(path))) {
      // Check environment restrictions
      if (process.env.NODE_ENV === 'production' && process.env.SWAGGER_ENABLED !== 'true') {
        logger.warn('Swagger access attempted in production', {
          ip: req.ip,
          path: req.path,
          userAgent: req.get('user-agent'),
        });

        res.status(403).json({
          success: false,
          error: {
            type: 'FORBIDDEN',
            message: 'API documentation is not available in production',
          },
        });
        return;
      }

      // Check authentication for protected docs
      if (process.env.SWAGGER_PROTECTED === 'true') {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Basic ')) {
          res.setHeader('WWW-Authenticate', 'Basic realm="API Documentation"');
          res.status(401).json({
            success: false,
            error: {
              type: 'AUTHENTICATION_ERROR',
              message: 'Authentication required for API documentation',
            },
          });
          return;
        }

        // Verify credentials
        const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
        const [username, password] = credentials.split(':');

        const validUsername = process.env.SWAGGER_USERNAME || 'admin';
        const validPassword = process.env.SWAGGER_PASSWORD || 'password';

        if (username !== validUsername || password !== validPassword) {
          logger.warn('Invalid Swagger credentials', {
            ip: req.ip,
            username,
          });

          res.status(401).json({
            success: false,
            error: {
              type: 'AUTHENTICATION_ERROR',
              message: 'Invalid credentials',
            },
          });
          return;
        }
      }

      // Log Swagger access
      logger.info('Swagger documentation accessed', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('user-agent'),
      });
    }

    next();
  };
}

// Swagger request validation
export function swaggerRequestValidator() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only validate requests to API endpoints
    if (!req.path.startsWith('/api/')) {
      next();
      return;
    }

    // Check content type for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type'];

      if (!contentType || !contentType.includes('application/json')) {
        res.status(415).json({
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Unsupported Media Type. Use application/json',
            code: 'UNSUPPORTED_MEDIA_TYPE',
          },
        });
        return;
      }
    }

    // Check accept header
    const acceptHeader = req.headers.accept;
    if (acceptHeader && !acceptHeader.includes('application/json')) {
      res.status(406).json({
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Not Acceptable. This API only returns application/json',
          code: 'NOT_ACCEPTABLE',
        },
      });
      return;
    }

    next();
  };
}

// Rate limiting for Swagger endpoints
export function swaggerRateLimit() {
  const rateLimitStore = new Map();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.path.startsWith('/api-docs')) {
      next();
      return;
    }

    const ip = req.ip;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100; // 100 requests per window

    const requests = rateLimitStore.get(ip) || [];

    // Remove old requests
    const recentRequests = requests.filter((time: number) => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      logger.warn('Swagger rate limit exceeded', {
        ip,
        path: req.path,
      });

      res.status(429).json({
        success: false,
        error: {
          type: 'RATE_LIMIT_ERROR',
          message: 'Too many requests to API documentation',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(windowMs / 1000),
        },
      });
      return;
    }

    // Add current request
    recentRequests.push(now);
    rateLimitStore.set(ip, recentRequests);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - recentRequests.length);
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

    next();
  };
}
