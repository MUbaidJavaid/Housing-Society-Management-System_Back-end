import { NextFunction, Request, RequestHandler, Response } from 'express';
import morgan from 'morgan';
import { logger, morganStream } from '../logger';
import { isMonitorPath } from '../utils/monitor-path';

// Morgan token for user ID (if authenticated)
morgan.token('userId', (req: Request) => {
  return (req as any).user?.id || '-';
});

// Morgan token for request ID
morgan.token('requestId', (req: Request) => {
  return (req as any).id || '-';
});

// Morgan token for response time in milliseconds
morgan.token('responseTimeMs', (req: Request, res: Response) => {
  if (!res.headersSent) return '-';

  // Get the start time from the request object
  const startTime = (req as any)._startAt;

  if (!startTime) {
    return '-';
  }

  // Calculate the difference
  const diff = process.hrtime(startTime);
  const ms = diff[0] * 1000 + diff[1] / 1000000; // Convert to milliseconds

  return ms.toFixed(3);
});

// Morgan middleware for HTTP logging with proper typing
export function httpLogger(): RequestHandler {
  const format =
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

  return morgan(format, {
    stream: morganStream,
    skip: (req: Request) => isMonitorPath(req.originalUrl || req.url),
  });
}

// Detailed request logging middleware
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isMonitorPath(req.originalUrl || req.url)) {
      next();
      return;
    }

    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logData = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        requestId: (req as any).id,
      };

      if (res.statusCode >= 500) {
        logger.error(`Request failed: ${req.method} ${req.url}`, logData);
      } else if (res.statusCode >= 400) {
        logger.warn(`Request warning: ${req.method} ${req.url}`, logData);
      }
    });

    next();
  };
}

// Sanitize request body (remove sensitive data)
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'creditCard',
    'cvv',
    'ssn',
    'socialSecurity',
    'apiKey',
    'privateKey',
  ];

  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (sanitized[key] && typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeRequestBody(sanitized[key]);
    }
  }

  return sanitized;
}

// Sanitize response body
function sanitizeResponseBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };

  // Remove large data or sensitive data from response logging
  if (sanitized.data && Array.isArray(sanitized.data) && sanitized.data.length > 10) {
    sanitized.data = `[Array with ${sanitized.data.length} items]`;
  }

  // Sanitize tokens in responses
  if (sanitized.accessToken) {
    sanitized.accessToken = '[REDACTED]';
  }
  if (sanitized.refreshToken) {
    sanitized.refreshToken = '[REDACTED]';
  }

  return sanitized;
}

let mongooseQueryLoggingPatched = false;

// Database query logging — patch once. Never wrap Query.exec per request (that leaks memory).
export function databaseLogger() {
  return (_req: Request, _res: Response, next: NextFunction) => {
    if (process.env.LOG_DATABASE_QUERIES !== 'true') {
      next();
      return;
    }

    if (mongooseQueryLoggingPatched) {
      next();
      return;
    }

    mongooseQueryLoggingPatched = true;
    const mongoose = require('mongoose');
    const originalExec = mongoose.Query.prototype.exec;
    const originalAggregateExec = mongoose.Aggregate.prototype.exec;

    mongoose.Query.prototype.exec = async function () {
      const start = Date.now();
      const result = await originalExec.apply(this, arguments);
      logger.debug('Database query executed', {
        collection: this.model.collection.name,
        operation: this.op,
        duration: Date.now() - start,
        query: sanitizeDatabaseQuery(this.getQuery()),
      });
      return result;
    };

    mongoose.Aggregate.prototype.exec = async function () {
      const start = Date.now();
      const result = await originalAggregateExec.apply(this, arguments);
      logger.debug('Database aggregation executed', {
        collection: this._model?.collection?.name || 'unknown',
        duration: Date.now() - start,
        pipeline: sanitizeAggregationPipeline(this.pipeline()),
      });
      return result;
    };

    next();
  };
}

// Sanitize database queries
function sanitizeDatabaseQuery(query: any): any {
  if (!query || typeof query !== 'object') {
    return query;
  }

  const sensitiveFields = ['password', 'token', 'secret'];
  const sanitized = { ...query };

  for (const field of sensitiveFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

// Sanitize aggregation pipeline
function sanitizeAggregationPipeline(pipeline: any[]): any[] {
  return pipeline.map(stage => {
    if (stage.$match) {
      return { $match: sanitizeDatabaseQuery(stage.$match) };
    }
    return stage;
  });
}

// Performance monitoring middleware
export function performanceLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (isMonitorPath(req.originalUrl || req.url)) {
      next();
      return;
    }

    const startTime = process.hrtime();

    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1000000;

      if (duration > 1000) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.url,
          duration: Math.round(duration),
          threshold: 1000,
          requestId: (req as any).id,
        });
      }
    });

    next();
  };
}

// Error logging middleware
export function errorLogger() {
  return (error: Error, req: Request, _res: Response, next: NextFunction) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: (req as any).id,
      userId: (req as any).user?.id,
      requestBody: sanitizeRequestBody(req.body),
      queryParams: req.query,
      routeParams: req.params,
    };

    // Log error based on type
    if (error.name === 'ValidationError' || (error as any).type === 'VALIDATION_ERROR') {
      logger.warn('Validation error', errorData);
    } else if (
      error.name === 'AuthenticationError' ||
      (error as any).type === 'AUTHENTICATION_ERROR'
    ) {
      logger.warn('Authentication error', errorData);
    } else if (
      error.name === 'AuthorizationError' ||
      (error as any).type === 'AUTHORIZATION_ERROR'
    ) {
      logger.warn('Authorization error', errorData);
    } else {
      logger.error('Unhandled error', errorData);
    }

    next(error);
  };
}
