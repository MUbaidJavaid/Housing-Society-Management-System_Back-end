// File: core/middleware-setup.ts
import compression from 'compression';
import express, { Application } from 'express';
import morgan from 'morgan';
import config from '../config';
import { gracefulShutdown, healthHeaders } from '../health/middleware/health.middleware';
import { responseTimeMiddleware } from '../middleware/response-time';
import {
  requestLogger,
  securityHeaders,
  securityMiddleware,
} from '../middleware/security.middleware';
import logger from './logger';

export function setupMiddlewares(app: Application, isShuttingDown: boolean = false): void {
  // 1. Graceful shutdown middleware
  app.use(gracefulShutdown(isShuttingDown));

  // 2. Health headers
  app.use(healthHeaders);

  // 3. Response time monitoring
  app.use(responseTimeMiddleware);

  // 4. Security middleware
  app.use(securityMiddleware);

  // 5. Custom security headers
  app.use(securityHeaders);

  // 6. Request logging
  if (config.isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(requestLogger);
  }

  // 7. Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 8. Compression
  if (config.compression.enabled) {
    app.use(compression(config.compression));
    logger.info('Compression middleware enabled');
  }

  // 9. Static file serving
  app.use('/public', express.static(config.staticFiles.path, config.staticFiles));

  // 10. Uploads directory
  app.use(
    '/uploads',
    express.static(config.paths.uploads, {
      ...config.staticFiles,
      maxAge: 0, // Don't cache uploads
    })
  );
}
