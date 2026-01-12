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
import { closeDatabase, initializeDatabase as connectToDatabase } from './database';
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
import dotenv from 'dotenv';
import { memberRoutes } from './Member/index-member';
import { plotRoutes } from './Plots/index-plot';
import { plotBlockRoutes } from './Plots/index-plotblock';
import { plotSizeRoutes } from './Plots/index-plotsize';
import { plotTypeRoutes } from './Plots/index-plottype';
import userRoutes from './routes/user.routes';
//

// Track graceful shutdown
let isShuttingDown = false;
dotenv.config();
/**
 * Initialize database connection
 */
async function initializeDatabase(): Promise<void> {
  console.log('🔄 Initializing MongoDB Atlas connection...');

  // Debug environment
  console.log('🔍 Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    NODE_VERSION: process.version,
  });

  try {
    // Add connection event listeners for debugging
    const mongoose = require('mongoose');

    mongoose.connection.on('connecting', () => {
      console.log('🔄 MongoDB connecting...');
    });

    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected');
    });

    mongoose.connection.on('error', (err: any) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // Attempt connection
    await connectToDatabase();

    console.log(`✅ MongoDB connected successfully`);

    logger.info('MongoDB Atlas connection established');
  } catch (error: any) {
    console.error('❌ FATAL: MongoDB Atlas connection failed');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
    });

    // Additional debugging
    if (error.message.includes('ENOTFOUND')) {
      console.error('🔧 Fix: Check your MongoDB Atlas cluster URL and DNS settings');
    } else if (error.message.includes('Authentication failed')) {
      console.error('🔧 Fix: Verify username/password in MONGODB_URI');
      console.error('🔧 Fix: Check if user has correct database permissions');
    } else if (error.message.includes('self signed certificate')) {
      console.error('🔧 Fix: Set MONGODB_TLS_ALLOW_INVALID_CERTIFICATES=true for testing');
    } else if (error.message.includes('timed out')) {
      console.error('🔧 Fix: Add your IP to Atlas whitelist');
      console.error('🔧 Fix: Increase timeout settings in .env');
    }

    logger.error('Failed to initialize MongoDB Atlas:', error);
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
  // app.get('/rate-limit/info', rateLimitMiddleware.rateLimitInfo);
  // app.get('/rate-limit/test', rateLimitMiddleware.testRateLimit, (_req: Request, res: Response) => {
  //   res.json({
  //     success: true,
  //     message: 'Rate limit test passed',
  //     timestamp: new Date().toISOString(),
  //   });
  // });

  // // Apply global rate limiting to all API routes (from second codebase)
  // app.use('/api/v1', rateLimitMiddleware.globalRateLimit);

  // // Apply route-specific rate limiting (from second codebase)
  // app.use(rateLimitMiddleware.routeSpecificRateLimit);

  // // Mount API routes with specific rate limiting
  // app.use('/api/v1/auth', rateLimitMiddleware.authRateLimit, authRoutes);
  // app.use(
  //   '/api/v1/public',
  //   rateLimitMiddleware.publicApiRateLimit,
  //   (_req: Request, res: Response) => {
  //     res.json({ message: 'Public API endpoint' });
  //   }
  // );
  app.use('/api/v1/users', userRoutes);
  // app.use('/api/v1/admin', rateLimitMiddleware.adminRateLimit, adminRoutes);
  // app.use('/api/v1/upload', rateLimitMiddleware.uploadRateLimit, uploadRoutes);

  // Also support the original API routes structure
  app.use('/api/auth', authRoutes);

  // PlotBlock routes
  app.use('/plotblocks', plotBlockRoutes);

  // PlotType routes
  app.use('/plottypes', plotTypeRoutes);

  // PlotSize routes
  app.use('/plotsizes', plotSizeRoutes);

  // Plot routes
  app.use('/plots', plotRoutes);

  //Member routes
  app.use('/members', memberRoutes);
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
      await closeDatabase();
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

// Add this function after imports
function validateEnvironment(): void {
  console.log('🔍 Validating environment variables...');

  // مرحلہ 1: ضروری متغیرات (Critical - app کام نہیں کرے گا)
  const criticalVars = [
    'MONGODB_URI', // یا MONGO_URI
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  // مرحلہ 2: اہم متغیرات (Important - بعض features کام نہیں کریں گے)
  const importantVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'FRONTEND_URL', 'CORS_ORIGIN'];

  // مرحلہ 3: اختیاری متغیرات (Optional - warnings دیں گے)
  const optionalVars = ['REDIS_URL', 'REDIS_HOST', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];

  const missingCritical: string[] = [];
  const missingImportant: string[] = [];
  const missingOptional: string[] = [];

  // Check critical variables
  criticalVars.forEach(varName => {
    if (!process.env[varName]) {
      // خاص صورت: MONGO_URI کو MONGODB_URI کے طور پر چیک کریں
      if (varName === 'MONGODB_URI' && process.env.MONGO_URI) {
        console.log(
          `✅ Using MONGO_URI as MONGODB_URI: ${process.env.MONGO_URI.substring(0, 20)}...`
        );
        process.env.MONGODB_URI = process.env.MONGO_URI;
      } else {
        missingCritical.push(varName);
      }
    }
  });

  // Check important variables
  importantVars.forEach(varName => {
    if (!process.env[varName]) {
      missingImportant.push(varName);
    }
  });

  // Check optional variables
  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      missingOptional.push(varName);
    }
  });

  // مرحلہ 4: Render-specific checks (production میں ضروری)
  if (process.env.NODE_ENV === 'production') {
    console.log('🏗️  Production environment detected');

    // Check for localhost URLs in production
    const localhostUrls = ['CORS_ORIGIN', 'FRONTEND_URL', 'GOOGLE_REDIRECT_URI'];

    localhostUrls.forEach(varName => {
      const value = process.env[varName];
      if (value && value.includes('localhost')) {
        console.warn(`⚠️  WARNING: ${varName} contains localhost in production: ${value}`);
        console.warn(`💡 In production, use your actual domain like https://your-app.onrender.com`);
      }
    });

    // Check if Redis is configured
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
      console.warn('⚠️  Redis not configured in production - rate limiting will use memory store');
      console.warn('💡 For production, consider using Redis for distributed rate limiting');
    }
  }

  // مرحلہ 5: نتائج کا اعلان
  console.log('\n📊 Environment Validation Summary:');
  console.log('='.repeat(50));

  if (missingCritical.length > 0) {
    console.error('❌ MISSING CRITICAL VARIABLES (App may not start):');
    missingCritical.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('💡 These variables are REQUIRED for the app to function');

    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 In production, these must be set in Render dashboard');
    } else {
      console.error('💡 Add these to your .env file');
    }
  }

  if (missingImportant.length > 0) {
    console.warn('⚠️  MISSING IMPORTANT VARIABLES (Some features disabled):');
    missingImportant.forEach(varName => {
      console.warn(`   - ${varName}`);
    });

    // Provide helpful suggestions
    missingImportant.forEach(varName => {
      switch (varName) {
        case 'SMTP_HOST':
          console.warn('   💡 Email service will be disabled');
          break;
        case 'FRONTEND_URL':
          console.warn('   💡 Using default frontend URL: http://localhost:3000');
          process.env.FRONTEND_URL = 'http://localhost:3000';
          break;
        case 'CORS_ORIGIN':
          console.warn('   💡 Using default CORS origin: *');
          process.env.CORS_ORIGIN = '*';
          break;
      }
    });
  }

  if (missingOptional.length > 0) {
    console.log('ℹ️  MISSING OPTIONAL VARIABLES:');
    missingOptional.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('💡 These are nice-to-have but not required');
  }

  // مرحلہ 6: JWT secrets length check
  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || '';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || '';

  if (jwtAccessSecret.length < 32) {
    console.error(
      `❌ JWT_ACCESS_SECRET is too short: ${jwtAccessSecret.length} chars (minimum 32)`
    );
    console.error('💡 Generate a strong secret: openssl rand -base64 32');
  } else {
    console.log(`✅ JWT_ACCESS_SECRET length: ${jwtAccessSecret.length} chars`);
  }

  if (jwtRefreshSecret.length < 32) {
    console.error(
      `❌ JWT_REFRESH_SECRET is too short: ${jwtRefreshSecret.length} chars (minimum 32)`
    );
  } else {
    console.log(`✅ JWT_REFRESH_SECRET length: ${jwtRefreshSecret.length} chars`);
  }

  // مرحلہ 7: MongoDB URI format check
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (mongoUri) {
    if (mongoUri.includes('@')) {
      // Hide password in logs
      const safeUri = mongoUri.replace(/:(.*)@/, ':****@');
      console.log(`✅ MongoDB URI: ${safeUri}`);
    } else {
      console.warn('⚠️  MongoDB URI may be incomplete (missing username/password)');
    }
  }

  // مرحلہ 8: Port check
  const port = process.env.PORT || '5000';
  console.log(`✅ Server Port: ${port}`);

  // مرحلہ 9: App name check
  const appName = process.env.APP_NAME || 'Housing Society Management System';
  console.log(`✅ App Name: ${appName}`);

  console.log('='.repeat(50));

  // مرحلہ 10: Decision - continue or exit
  if (missingCritical.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 CRITICAL: Missing required environment variables in production');
      console.error('💡 Please set these variables in Render dashboard immediately');

      // In production, we might want to continue with degraded functionality
      // But for critical vars like MongoDB, we should exit
      if (missingCritical.includes('MONGODB_URI')) {
        console.error('🚨 FATAL: MongoDB URI is required. Exiting...');
        process.exit(1);
      }
    } else {
      console.error('🚨 Missing critical environment variables. Exiting...');
      process.exit(1);
    }
  }

  console.log('✅ Environment validation completed');
}

/**
 * Create and configure the Express application
 */
export async function createApp(): Promise<Application> {
  // Setup log rotation
  console.log('createApp');

  // Add this line at the beginning
  validateEnvironment();

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

// export async function startServer(): Promise<Application> {
//   try {
//     console.log('🟡 [startServer-1] Creating app...');
//     const app = await createApp();
//     console.log('✅ [startServer-2] App created');

//     // FIX: PORT must be a number, convert from string if needed
//     // const PORT = Number(process.env.PORT) || config.port || 10000;
//     // FIX: Use '0.0.0.0' for production (Render)
//     // const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : config.host || 'localhost';
//     // Render پر PORT ماحولیاتی متغیر سے آتا ہے
//     const PORT = Number(process.env.PORT) || 3000;

//     // Render پر ہمیشہ '0.0.0.0' استعمال کریں
//     const HOST = '0.0.0.0';

//     console.log(`🚀 Server starting on ${HOST}:${PORT}`);
//     console.log(`🔧 Config: Port=${PORT}, Host=${HOST}, NODE_ENV=${process.env.NODE_ENV}`);
//     const server = app.listen(PORT, HOST, () => {
//       console.log(`🚀 [startServer-3] Server listening on ${HOST}:${PORT}`);
//       logger.info(`Server started on ${HOST}:${PORT}`);
//     });

//     server.on('error', (error: NodeJS.ErrnoException) => {
//       console.error('❌ [startServer-ERROR] Server error:', error);
//       if (error.code === 'EADDRINUSE') {
//         console.error(`Port ${config.port} is already in use`);
//       }
//       process.exit(1);
//     });
//     (app as any).server = server;
//     return app;
//   } catch (error) {
//     console.error('❌ [startServer-CATCH] Failed to start server:', error);
//     logger.error('Failed to start server:', error);
//     process.exit(1);
//   }
// }
export async function startServer(): Promise<Application> {
  try {
    console.log('🟡 [startServer-1] Creating app...');
    const app = await createApp();
    console.log('✅ [startServer-2] App created');

    // FIX: Render پر PORT ماحولیاتی متغیر سے آتا ہے
    const PORT = Number(process.env.PORT) || 10000;

    // FIX: Render پر '0.0.0.0' استعمال کریں
    const HOST = '0.0.0.0';

    console.log(`🔧 Server Config: Port=${PORT}, Host=${HOST}`);

    const server = app.listen(PORT, HOST, () => {
      console.log(`✅ Server successfully started on port ${PORT}`);
      logger.info(`Server started on ${HOST}:${PORT}`);

      // یہ میسج Render کو دکھائے گا کہ سرور چل رہا ہے
      console.log(`🚀 Application is running on http://${HOST}:${PORT}`);
      console.log(`📡 Health check: http://${HOST}:${PORT}/health`);
      console.log(`🔍 Ping endpoint: http://${HOST}:${PORT}/ping`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      console.error('❌ Server error:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      }
      process.exit(1);
    });

    (app as any).server = server;
    return app;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}
