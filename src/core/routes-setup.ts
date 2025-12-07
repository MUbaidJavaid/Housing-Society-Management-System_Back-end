// File: core/routes-setup.ts
import { Application, Request, Response } from 'express';
import config from '../config';
import { healthCheckSystem } from '../health';
import { requireHealthy } from '../health/middleware/health.middleware';
import healthRoutes from '../health/routes/health.routes';
import apiRoutes from '../routes/user.routes'; // You'll need to create this

export function setupRoutes(app: Application): void {
  // Mount health routes
  app.use('/health', healthRoutes);

  // Simple ping endpoint at root
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

  // Mount API routes
  app.use(`${config.api.prefix}/${config.api.version}`, apiRoutes);

  // API welcome route with health check
  app.get(
    `${config.api.prefix}/${config.api.version}`,
    requireHealthy,
    (req: Request, res: Response) => {
      res.json({
        success: true,
        message: `Welcome to ${config.env} API`,
        version: config.api.version,
        timestamp: new Date().toISOString(),
        docs: `${req.protocol}://${req.get('host')}/api-docs`,
        health: `${req.protocol}://${req.get('host')}/health`,
      });
    }
  );
}
