// src/app.ts
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import configurations and middleware
import config from './config';
import { databaseManager } from './database';
import { healthCheckSystem } from './health';
import {
  gracefulShutdown,
  healthHeaders,
  requireHealthy,
} from './health/middleware/health.middleware';
import healthRoutes from './health/routes/health.routes';
import { logger } from './logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { responseTimeMiddleware } from './middleware/response-time';
import {
  requestLogger,
  securityHeaders,
  securityMiddleware,
} from './middleware/security.middleware';

// Import rate limiting middleware
import rateLimitMiddleware from './middleware/rate-limit';
import { initializeRateLimiter } from './rate-limiter';

// Import logging middlewares
import { setupSwagger } from './docs/swagger';
import {
  databaseLogger,
  errorLogger,
  httpLogger,
  performanceLogger,
} from './middleware/logging.middleware';
import {
  swaggerAuth,
  swaggerRateLimit,
  swaggerRequestValidator,
} from './middleware/swagger.middleware';
import { scheduleLogRotation, setupLogRotation } from './utils/log-rotation';

// Import routes from the second codebase
import authRoutes from './auth/routes/auth.routes';
// import uploadRoutes from './routes/upload.routes';
import console from 'console';
import userRoutes from './routes/user.routes';

// Track graceful shutdown
let isShuttingDown = false;

/**
 * Initialize database connection
 */
async function initializeDatabase(): Promise<void> {
  console.log('initializeDatabase');
  try {
    await databaseManager.connect();
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

/**
 * Initialize rate limiter
 */
async function initializeRateLimiterSystem(): Promise<void> {
  console.log('initializeRateLimiterSystem');
  try {
    initializeRateLimiter();
    logger.info('Rate limiter initialized');
  } catch (error) {
    logger.warn('Failed to initialize rate limiter:', error);
    // Don't exit on rate limiter failure - continue without rate limiting
  }
}

/**
 * Setup all middleware
 */
function setupMiddleware(app: Application): void {
  console.log('setupMiddleware');
  // 1. Graceful shutdown middleware
  app.use(gracefulShutdown(isShuttingDown));

  // 2. Health headers
  app.use(healthHeaders);

  // 3. Security middleware
  app.use(helmet());
  app.use(cors(config.cors || {}));
  app.use(securityMiddleware);
  app.use(securityHeaders);

  // 4. Request ID middleware - FIXED with underscore
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    (_req as any).id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    next();
  });

  // 5. HTTP logging (Morgan) - this returns middleware
  app.use(httpLogger());

  // 6. Custom request logging
  app.use(requestLogger);

  // 7. Database query logging
  app.use(databaseLogger());

  // 8. Performance monitoring
  app.use(performanceLogger());
  app.use(responseTimeMiddleware);

  // 9. Body parsers and cookie parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // 10. Request logging (conditional based on environment)
  if (config.isDevelopment) {
    app.use(morgan('dev'));
  }

  // 11. Compression
  if (config.compression?.enabled) {
    app.use(compression(config.compression));
    logger.info('Compression middleware enabled');
  }

  // 12. Static file serving
  app.use(
    '/public',
    express.static(config.staticFiles?.path || 'public', config.staticFiles || {})
  );

  // 13. Uploads directory
  app.use(
    '/uploads',
    express.static(config.paths?.uploads || 'uploads', {
      ...config.staticFiles,
      maxAge: 0, // Don't cache uploads
    })
  );

  // 14. Swagger middleware
  app.use(swaggerAuth());
  app.use(swaggerRequestValidator());
  app.use(swaggerRateLimit());

  // 15. Rate limit bypass for trusted sources (from second codebase)
  app.use(rateLimitMiddleware.rateLimitBypass);

  // 16. Development rate limit testing (from second codebase)
  app.use(rateLimitMiddleware.devRateLimitTest);
}

/**
 * Setup all routes
 */
function setupRoutes(app: Application): void {
  // Mount health routes
  console.log('setupRoutes');
  app.use('/health', healthRoutes);

  // Simple ping endpoint at root (from both codebases)
  app.get('/ping', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'HSMS Back-end',
      environment: config.env,
    });
  });

  // Health check endpoint at root
  app.get('/health-check', requireHealthy, async (_req: Request, res: Response) => {
    const healthResponse = await healthCheckSystem.runAllChecks();

    res.json({
      status: healthResponse.status,
      timestamp: healthResponse.timestamp,
      uptime: healthResponse.uptime,
      checks: healthResponse.summary,
    });
  });

  // Health endpoint from second codebase
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      rateLimiting: {
        enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        redis: process.env.REDIS_HOST || 'localhost',
      },
    });
  });

  // Rate limit endpoints from second codebase
  app.get('/rate-limit/info', rateLimitMiddleware.rateLimitInfo);
  app.get('/rate-limit/test', rateLimitMiddleware.testRateLimit, (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Rate limit test passed',
      timestamp: new Date().toISOString(),
    });
  });

  // Apply global rate limiting to all API routes (from second codebase)
  app.use('/api/v1', rateLimitMiddleware.globalRateLimit);

  // Apply route-specific rate limiting (from second codebase)
  app.use(rateLimitMiddleware.routeSpecificRateLimit);

  // Mount API routes with specific rate limiting
  app.use('/api/v1/auth', rateLimitMiddleware.authRateLimit, authRoutes);
  app.use(
    '/api/v1/public',
    rateLimitMiddleware.publicApiRateLimit,
    (_req: Request, res: Response) => {
      res.json({ message: 'Public API endpoint' });
    }
  );
  app.use('/api/v1/users', userRoutes);
  // app.use('/api/v1/admin', rateLimitMiddleware.adminRateLimit, adminRoutes);
  // app.use('/api/v1/upload', rateLimitMiddleware.uploadRateLimit, uploadRoutes);

  // Also support the original API routes structure
  app.use('/api/auth', authRoutes);

  // API welcome route with health check
  app.get('/api/v1', requireHealthy, (req: Request, res: Response) => {
    res.json({
      success: true,
      message: `Welcome to ${config.env} API`,
      version: config.api.version,
      timestamp: new Date().toISOString(),
      docs: `${req.protocol}://${req.get('host')}/api-docs`,
      health: `${req.protocol}://${req.get('host')}/health`,
    });
  });

  // Example protected route with health check
  app.get('/api/v1/protected', requireHealthy, (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Access granted to protected route',
      user: { id: 1, name: 'John Doe' },
    });
  });

  // Admin-only rate limit reset endpoint (from second codebase)
  app.post('/api/v1/admin/rate-limit/reset', rateLimitMiddleware.rateLimitReset);
}

/**
 * Setup error handling
 */
function setupErrorHandling(app: Application): void {
  // 404 handler
  console.log('setupErrorHandling');
  app.use(notFoundHandler);

  // Error logging middleware
  app.use(errorLogger());

  // Global error handler
  app.use(errorHandler);

  // Unhandled promise rejections
  process.on('unhandledRejection', (reason: Error) => {
    logger.error('Unhandled Rejection:', reason);
    throw reason;
  });

  // Uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown(app: Application): void {
  console.log('setupGracefulShutdown');

  const gracefulShutdownHandler = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    isShuttingDown = true;

    // Get the server instance
    const server = (app as any).server;
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    // Close database connections
    try {
      await databaseManager.disconnect();
      logger.info('Database connections closed');
    } catch (error) {
      logger.error('Error closing database connections:', error);
    }

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

/**
 * Create and configure the Express application
 */
export async function createApp(): Promise<Application> {
  // Setup log rotation
  console.log('createApp');

  setupLogRotation();
  scheduleLogRotation();
  console.log('🟡 [createApp-1] Starting...');
  // Create Express app
  const app = express();
  console.log('✅ [createApp-2] Express app created');
  // Initialize database
  await initializeDatabase();

  // Initialize rate limiter
  await initializeRateLimiterSystem();

  // Setup middleware
  setupMiddleware(app);

  // Setup Swagger documentation
  setupSwagger(app);

  // Setup routes
  setupRoutes(app);

  // Setup error handling
  setupErrorHandling(app);

  // Setup graceful shutdown
  setupGracefulShutdown(app);
  console.log('✅ [createApp-3] Returning app');
  return app;
}

/**
 * Start the Express server and return the app instance
 */
// export async function startServer(): Promise<Application> {
//   try {
//     const app = await createApp();

//     const server = app.listen(config.port, config.host, () => {
//       logger.info(`
// 🚀 Server started successfully!
// 📍 Environment: ${config.env}
// 🌐 URL: http://${config.host}:${config.port}
// 📁 API: http://${config.host}:${config.port}/api/v1
// ⚡ Health: http://${config.host}:${config.port}/health
// ❤️  Live: http://${config.host}:${config.port}/health/live
// ✅ Ready: http://${config.host}:${config.port}/health/ready
// 📊 Metrics: http://${config.host}:${config.port}/health/metrics
// 📝 Logs: ${config.paths?.logs || 'logs'}
// 📚 Docs: http://${config.host}:${config.port}/api-docs
// 🔐 Rate Limiting: ${process.env.RATE_LIMIT_ENABLED || 'enabled'}
// 🗄️  Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}
//       `);

//       // Log available endpoints
//       logger.debug('Available endpoints:', {
//         api: `http://localhost:${config.port}/api/v1`,
//         docs: `http://localhost:${config.port}/api-docs`,
//         health: `http://localhost:${config.port}/health`,
//         ping: `http://localhost:${config.port}/ping`,
//         rateLimitInfo: `http://localhost:${config.port}/rate-limit/info`,
//         rateLimitTest: `http://localhost:${config.port}/rate-limit/test`,
//       });
//     });

//     // Store server reference on app for graceful shutdown
//     (app as any).server = server;

//     // Track server start time for uptime calculation
//     (server as any).startTime = Date.now();

//     return app;
//   } catch (error) {
//     logger.error('Failed to start server:', error);
//     process.exit(1);
//   }
// }

export async function startServer(): Promise<Application> {
  try {
    console.log('🟡 [startServer-1] Creating app...');
    const app = await createApp();
    console.log('✅ [startServer-2] App created');

    const server = app.listen(config.port, config.host, () => {
      console.log(`🚀 [startServer-3] Server listening on ${config.host}:${config.port}`);
      logger.info(`Server started on ${config.host}:${config.port}`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      console.error('❌ [startServer-ERROR] Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${config.port} is already in use`);
      }
      process.exit(1);
    });

    return app;
  } catch (error) {
    console.error('❌ [startServer-CATCH] Failed to start server:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}
