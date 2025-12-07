import { NextFunction, Request, Response, Router } from 'express';
import { authenticate, requireRole } from '../../auth/middleware/auth';
import { UserRole } from '../../auth/types';
import config from '../../config';
import { AppError } from '../../middleware/error.middleware';
import { getResponseTimeStats } from '../../middleware/response-time';
import { DatabaseHealthCheck } from '../checks/database.check';
import { healthCheckSystem } from '../index';

const router: Router = Router();

/**
 * Simple ping endpoint
 * GET /ping
 */
router.get('/ping', (_req: Request, res: Response) => {
  const pingResponse = healthCheckSystem.getPingResponse();

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.json({
    status: 'success',
    data: pingResponse,
    message: 'Service is alive',
  });
});

/**
 * Health check endpoint
 * GET /health
 */
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const responseStartTime = Date.now();
    const detailed = req.query.detailed === 'true' || req.query.detailed === '1';
    const force = req.query.force === 'true' || req.query.force === '1';

    // Clear cache if force refresh
    if (force) {
      healthCheckSystem.clearCache();
    }

    const healthResponse = await healthCheckSystem.runAllChecks(responseStartTime);

    // Set cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Set health status header
    res.setHeader('X-Health-Status', healthResponse.status);

    // Set appropriate HTTP status code
    let statusCode = 200;
    if (healthResponse.status === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    } else if (healthResponse.status === 'degraded') {
      statusCode = 206; // Partial Content
    }

    // Simplify response if not detailed
    const response = detailed
      ? healthResponse
      : {
          status: healthResponse.status,
          timestamp: healthResponse.timestamp,
          uptime: healthResponse.uptime,
          version: healthResponse.version,
          environment: healthResponse.environment,
          responseTime: healthResponse.responseTime,
          summary: healthResponse.summary,
        };

    res.status(statusCode).json({
      status: 'success',
      data: response,
      message: `Service is ${healthResponse.status}`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Readiness endpoint for Kubernetes
 * GET /health/ready
 */
router.get('/health/ready', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const readiness = await healthCheckSystem.getReadinessStatus();

    const statusCode = readiness.ready ? 200 : 503;

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Readiness-Status', readiness.ready ? 'ready' : 'not-ready');

    res.status(statusCode).json({
      status: readiness.ready ? 'ready' : 'not-ready',
      timestamp: new Date().toISOString(),
      checks: readiness.checks,
      message: readiness.ready
        ? 'Service is ready to accept traffic'
        : 'Service is not ready to accept traffic',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Liveness endpoint for Kubernetes
 * GET /health/live
 */
router.get('/health/live', (_req: Request, res: Response) => {
  const liveness = healthCheckSystem.getLivenessStatus();

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Liveness-Status', 'alive');

  res.json({
    status: 'alive',
    timestamp: liveness.timestamp.toISOString(),
    uptime: liveness.uptime,
    message: 'Service is alive',
  });
});

/**
 * Detailed metrics endpoint (protected)
 * GET /health/metrics
 */
router.get(
  '/health/metrics',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  (_req: Request, res: Response, next: NextFunction) => {
    try {
      const responseTimeStats = getResponseTimeStats();
      const memoryUsage = process.memoryUsage();

      const metrics = {
        timestamp: new Date().toISOString(),
        process: {
          uptime: process.uptime(),
          memory: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external,
            arrayBuffers: memoryUsage.arrayBuffers,
          },
          cpu: process.cpuUsage(),
          pid: process.pid,
          ppid: process.ppid,
          version: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        system: {
          loadavg: require('os').loadavg(),
          freemem: require('os').freemem(),
          totalmem: require('os').totalmem(),
          uptime: require('os').uptime(),
          cpus: require('os').cpus().length,
        },
        responseTimes: responseTimeStats,
        connections: (process as any)._getActiveHandles?.()?.length || 0,
        requests: (process as any)._getActiveRequests?.()?.length || 0,
      };

      res.json({
        status: 'success',
        data: metrics,
        message: 'System metrics retrieved',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * API version information
 * GET /health/version
 */
router.get('/health/version', (_req: Request, res: Response) => {
  const apiVersions = healthCheckSystem.getApiVersions();
  const currentVersion = apiVersions.find(v => !v.deprecated);

  res.json({
    status: 'success',
    data: {
      versions: apiVersions,
      current: currentVersion,
      latest: apiVersions[0],
      environment: config.env,
      nodeVersion: process.version,
      buildDate: process.env.BUILD_DATE || new Date().toISOString(),
      commitHash: process.env.COMMIT_HASH || 'unknown',
    },
    message: 'API version information',
  });
});

/**
 * Service dependencies information
 * GET /health/dependencies
 */
router.get('/health/dependencies', async (_req: Request, res: Response) => {
  const dependencies = healthCheckSystem.getServiceDependencies();

  // Check each dependency's health
  const dependenciesWithHealth = await Promise.all(
    dependencies.map(async dep => {
      try {
        // Try to ping the service if it has a health endpoint
        if (dep.healthEndpoint) {
          const axios = require('axios');
          const response = await axios.get(dep.healthEndpoint, { timeout: 5000 });
          return {
            ...dep,
            status: 'healthy',
            responseTime: response.duration,
            lastChecked: new Date().toISOString(),
          };
        }

        return {
          ...dep,
          status: 'unknown',
          lastChecked: new Date().toISOString(),
        };
      } catch (error: any) {
        return {
          ...dep,
          status: 'unhealthy',
          lastChecked: new Date().toISOString(),
          error: error.message,
        };
      }
    })
  );

  res.json({
    status: 'success',
    data: {
      dependencies: dependenciesWithHealth,
      total: dependencies.length,
      healthy: dependenciesWithHealth.filter(d => d.status === 'healthy').length,
      unhealthy: dependenciesWithHealth.filter(d => d.status === 'unhealthy').length,
      unknown: dependenciesWithHealth.filter(d => d.status === 'unknown').length,
    },
    message: 'Service dependencies information',
  });
});

/**
 * Database health check
 * GET /health/database
 */
router.get('/health/database', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dbCheck = new DatabaseHealthCheck();

    const [connectionResult, performanceResult, replicationResult] = await Promise.all([
      dbCheck.check(),
      dbCheck.checkPerformance(),
      dbCheck.checkReplication(),
    ]);

    const allHealthy = [connectionResult, performanceResult, replicationResult].every(
      r => r.status === 'healthy'
    );

    const statusCode = allHealthy ? 200 : 503;

    res.status(statusCode).json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        connection: connectionResult,
        performance: performanceResult,
        replication: replicationResult,
      },
      summary: {
        connection: connectionResult.status,
        performance: performanceResult.status,
        replication: replicationResult.status,
      },
      message: allHealthy ? 'Database is healthy' : 'Database has some issues',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Clear health check cache (admin only)
 * DELETE /health/cache
 */
router.delete(
  '/health/cache',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  (_req: Request, res: Response) => {
    healthCheckSystem.clearCache();

    res.json({
      status: 'success',
      message: 'Health check cache cleared',
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * Health check configuration (admin only)
 * GET /health/config
 */
router.get(
  '/health/config',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  (_req: Request, res: Response) => {
    const healthConfig = healthCheckSystem.getConfig();

    // Remove sensitive information
    const safeConfig = { ...healthConfig };
    delete (safeConfig as any).sensitive;

    res.json({
      status: 'success',
      data: safeConfig,
      message: 'Health check configuration',
    });
  }
);

/**
 * Update health check configuration (admin only)
 * PATCH /health/config
 */
router.patch(
  '/health/config',
  authenticate,
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const newConfig = req.body;

      // Validate configuration
      if (
        newConfig.cacheDuration &&
        (newConfig.cacheDuration < 0 || newConfig.cacheDuration > 60000)
      ) {
        throw new AppError(400, 'cacheDuration must be between 0 and 60000');
      }

      if (newConfig.timeout && (newConfig.timeout < 1000 || newConfig.timeout > 60000)) {
        throw new AppError(400, 'timeout must be between 1000 and 60000');
      }

      healthCheckSystem.updateConfig(newConfig);
      healthCheckSystem.clearCache();

      res.json({
        status: 'success',
        message: 'Health check configuration updated',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
