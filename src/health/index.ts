import packageJson from '../../package.json';
import config from '../config';
import logger from '../core/logger';
import {
  DiskSpaceHealthCheck,
  FileSystemHealthCheck,
  SystemResourcesHealthCheck,
} from './checks/custom.check';
import { DatabaseHealthCheck } from './checks/database.check';
import { CommonExternalChecks } from './checks/external.check';
import { RedisHealthCheck } from './checks/redis.check';
import {
  ApiVersion,
  HealthCheckConfig,
  HealthCheckResult,
  HealthResponse,
  HealthStatus,
  RegisteredCheck,
  ServiceDependency,
  Severity,
} from './types';

export class HealthCheckSystem {
  private checks: RegisteredCheck[] = [];
  private cache: {
    data: HealthResponse | null;
    timestamp: number;
  } = { data: null, timestamp: 0 };
  private config: HealthCheckConfig;
  private apiVersions: ApiVersion[] = [];
  private serviceDependencies: ServiceDependency[] = [];

  constructor(config?: Partial<HealthCheckConfig>) {
    this.config = {
      enabled: true,
      timeout: 30000,
      cacheDuration: 15000, // 15 seconds cache
      detailed: process.env.NODE_ENV !== 'production',
      exposeEnvironment: true,
      exposeVersion: true,
      exposeMetrics: true,
      customChecks: [],
      ...config,
    };

    this.initializeDefaultChecks();
    this.initializeApiVersions();
    this.initializeServiceDependencies();
  }

  /**
   * Initialize default health checks
   */
  private initializeDefaultChecks(): void {
    // Database check
    this.registerCheck({
      name: 'database',
      check: new DatabaseHealthCheck().check,
      severity: Severity.CRITICAL || 'critical',
      component: 'MongoDB',
      componentType: 'internal',
    });

    // Redis check (if configured)
    if (process.env.REDIS_URL) {
      this.registerCheck({
        name: 'redis',
        check: new RedisHealthCheck(process.env.REDIS_URL).check,
        severity: Severity.HIGH || 'high',
        component: 'Redis',
        componentType: 'external',
      });
    }

    // System resources check
    this.registerCheck({
      name: 'system-resources',
      check: new SystemResourcesHealthCheck().check,
      severity: Severity.MEDIUM || 'medium',
      component: 'System',
      componentType: 'infrastructure',
    });

    // Disk space check
    this.registerCheck({
      name: 'disk-space',
      check: new DiskSpaceHealthCheck().check,
      severity: Severity.HIGH || 'high',
      component: 'Disk',
      componentType: 'infrastructure',
    });

    // File system check
    this.registerCheck({
      name: 'file-system',
      check: new FileSystemHealthCheck().check,
      severity: Severity.MEDIUM || 'medium',
      component: 'File System',
      componentType: 'infrastructure',
    });

    // Add custom checks from config
    this.config.customChecks.forEach(checkName => {
      this.registerCustomCheck(checkName);
    });
  }

  /**
   * Initialize API version information
   */
  private initializeApiVersions(): void {
    this.apiVersions = [
      {
        version: packageJson.version || '1.0.0',
        name: 'Current API',
        description: packageJson.description || 'Express TypeScript API',
        documentation: process.env.API_DOCS_URL || '/api-docs',
        supportedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        deprecated: false,
        endpoints: ['/api/v1/*'],
      },
    ];

    // Add deprecated versions if any
    if (process.env.DEPRECATED_API_VERSIONS) {
      const deprecatedVersions = process.env.DEPRECATED_API_VERSIONS.split(',');
      deprecatedVersions.forEach(version => {
        this.apiVersions.push({
          version,
          name: `Deprecated API v${version}`,
          deprecated: true,
          supportedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
      });
    }
  }

  /**
   * Initialize service dependencies
   */
  private initializeServiceDependencies(): void {
    this.serviceDependencies = [
      {
        name: 'MongoDB Database',
        type: 'database',
        url: process.env.MONGODB_URI?.split('@').pop() || 'localhost:27017',
        description: 'Primary database for application data',
        required: true,
        healthEndpoint: '/health/database',
      },
    ];

    if (process.env.REDIS_URL) {
      this.serviceDependencies.push({
        name: 'Redis Cache',
        type: 'cache',
        url: process.env.REDIS_URL,
        description: 'In-memory data structure store for caching',
        required: false,
      });
    }

    if (process.env.EMAIL_SERVICE_URL) {
      this.serviceDependencies.push({
        name: 'Email Service',
        type: 'api',
        url: process.env.EMAIL_SERVICE_URL,
        description: 'Service for sending transactional emails',
        required: false,
      });
    }

    if (process.env.STORAGE_SERVICE_URL) {
      this.serviceDependencies.push({
        name: 'Storage Service',
        type: 'storage',
        url: process.env.STORAGE_SERVICE_URL,
        description: 'Object storage for files and media',
        required: false,
      });
    }
  }

  /**
   * Register a custom health check
   */
  private registerCustomCheck(checkName: string): void {
    switch (checkName) {
      case 'email-service':
        if (process.env.EMAIL_SERVICE_URL) {
          const emailCheck = CommonExternalChecks.createEmailServiceCheck();
          this.registerCheck({
            name: 'email-service',
            check: emailCheck.check.bind(emailCheck),
            severity: Severity.MEDIUM || 'medium',
            component: 'Email Service',
            componentType: 'external',
          });
        }
        break;

      case 'storage-service':
        if (process.env.STORAGE_SERVICE_URL) {
          const storageCheck = CommonExternalChecks.createStorageServiceCheck();
          this.registerCheck({
            name: 'storage-service',
            check: storageCheck.check.bind(storageCheck),
            severity: Severity.MEDIUM || 'medium',
            component: 'Storage Service',
            componentType: 'external',
          });
        }
        break;

      case 'payment-gateway':
        if (process.env.PAYMENT_GATEWAY_URL) {
          const paymentCheck = CommonExternalChecks.createPaymentGatewayCheck();
          this.registerCheck({
            name: 'payment-gateway',
            check: paymentCheck.check.bind(paymentCheck),
            severity: Severity.HIGH || 'high',
            component: 'Payment Gateway',
            componentType: 'external',
          });
        }
        break;

      // Add more custom checks as needed
    }
  }

  /**
   * Register a health check
   */
  registerCheck(check: RegisteredCheck): void {
    this.checks.push(check);
    logger.info(`Registered health check: ${check.name}`);
  }

  /**
   * Unregister a health check
   */
  unregisterCheck(name: string): void {
    this.checks = this.checks.filter(check => check.name !== name);
  }

  private normalizeSeverity(severityInput: string | Severity): Severity {
    if (typeof severityInput === 'string') {
      const normalized = severityInput.toLowerCase();
      switch (normalized) {
        case 'low':
          return Severity.LOW;
        case 'medium':
          return Severity.MEDIUM;
        case 'high':
          return Severity.HIGH;
        case 'critical':
          return Severity.CRITICAL;
        default:
          return Severity.MEDIUM;
      }
    }
    return severityInput;
  }

  private toHealthCheckResult(input: any): HealthCheckResult {
    return {
      name: input.name,
      status: input.status,
      severity: this.normalizeSeverity(input.severity),
      message: input.message || '',
      timestamp: input.timestamp || new Date(),
      duration: input.duration || 0,
      component: input.component || 'unknown',
      componentType: input.componentType || 'external',
      ...(input.error && { error: input.error }),
    };
  }
  /**
   * Run all health checks
   */
  async runAllChecks(responseStartTime?: number): Promise<HealthResponse> {
    // Check cache first
    if (this.cache.data && Date.now() - this.cache.timestamp < this.config.cacheDuration) {
      return this.cache.data;
    }

    const startTime = Date.now();
    const checkPromises = this.checks.map(check =>
      this.runSingleCheck(check).catch(error => ({
        name: check.name,
        status: HealthStatus.UNHEALTHY,
        severity: check.severity || 'medium',
        message: `Health check failed: ${error.message}`,
        timestamp: new Date(),
        duration: 0,
        component: check.component || check.name,
        componentType: check.componentType || 'external',
        error: error.message,
      }))
    );

    const results = await Promise.all(checkPromises);
    const checksMap: Record<string, HealthCheckResult> = {};

    // Convert all results to ensure proper type
    results.forEach(result => {
      const normalizedResult = this.toHealthCheckResult(result);
      checksMap[normalizedResult.name] = normalizedResult;
    });

    // Calculate summary
    const summary = {
      total: results.length,
      healthy: results.filter(r => r.status === HealthStatus.HEALTHY).length,
      unhealthy: results.filter(r => r.status === HealthStatus.UNHEALTHY).length,
      degraded: results.filter(r => r.status === HealthStatus.DEGRADED).length,
      unknown: results.filter(r => r.status === HealthStatus.UNKNOWN).length,
    };

    // Determine overall status
    let overallStatus = HealthStatus.HEALTHY;

    if (summary.unhealthy > 0) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (summary.degraded > 0) {
      overallStatus = HealthStatus.DEGRADED;
    }

    // Collect system metrics
    const metrics = this.config.exposeMetrics
      ? {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          eventLoopDelay: await this.measureEventLoopDelay(),
          activeHandles: (process as any)._getActiveHandles?.()?.length || 0,
          activeRequests: (process as any)._getActiveRequests?.()?.length || 0,
        }
      : undefined;

    // Build response
    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date(),
      uptime: process.uptime(),
      version: packageJson.version || '1.0.0',
      environment: config.env,
      responseTime: responseStartTime ? Date.now() - responseStartTime : 0,
      checks: checksMap,
      summary,
      metrics,
      info: this.config.detailed
        ? {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            hostname: require('os').hostname(),
          }
        : undefined,
    };

    // Cache the result
    this.cache = {
      data: response,
      timestamp: Date.now(),
    };

    logger.debug(`Health check completed in ${Date.now() - startTime}ms`);

    return response;
  }

  /**
   * Run a single health check
   */
  private async runSingleCheck(check: RegisteredCheck): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        check.check(),
        new Promise<HealthCheckResult>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), check.timeout || 10000)
        ),
      ]);

      const duration = Date.now() - startTime;

      return {
        ...result,
        duration,
        timestamp: new Date(),
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      return {
        name: check.name,
        status: HealthStatus.UNHEALTHY,
        severity: Severity.MEDIUM || 'medium',
        message: `Health check failed: ${error.message}`,
        timestamp: new Date(),
        duration,
        component: check.component || check.name,
        componentType: check.componentType || 'external',
        error: error.message,
      };
    }
  }

  /**
   * Measure event loop delay
   */
  private async measureEventLoopDelay(): Promise<number> {
    return new Promise(resolve => {
      const start = process.hrtime();
      setImmediate(() => {
        const diff = process.hrtime(start);
        const nanoseconds = diff[0] * 1e9 + diff[1];
        const milliseconds = nanoseconds / 1e6;
        resolve(milliseconds);
      });
    });
  }

  /**
   * Get API version information
   */
  getApiVersions(): ApiVersion[] {
    return this.apiVersions;
  }

  /**
   * Get service dependencies
   */
  getServiceDependencies(): ServiceDependency[] {
    return this.serviceDependencies;
  }

  /**
   * Get health check configuration
   */
  getConfig(): HealthCheckConfig {
    return this.config;
  }

  /**
   * Update health check configuration
   */
  updateConfig(newConfig: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear health check cache
   */
  clearCache(): void {
    this.cache = { data: null, timestamp: 0 };
  }

  /**
   * Get a simple ping response
   */
  getPingResponse(): { status: string; timestamp: Date; uptime: number } {
    return {
      status: 'ok',
      timestamp: new Date(),
      uptime: process.uptime(),
    };
  }

  /**
   * Get readiness status for Kubernetes
   */
  async getReadinessStatus(): Promise<{ ready: boolean; checks: Record<string, boolean> }> {
    // For readiness, we only check critical dependencies
    const criticalChecks = this.checks.filter(
      check => check.severity === 'critical' || check.severity === 'high'
    );

    const checkPromises = criticalChecks.map(async check => {
      try {
        const result = await this.runSingleCheck(check);
        return { name: check.name, ready: result.status === HealthStatus.HEALTHY };
      } catch {
        return { name: check.name, ready: false };
      }
    });

    const results = await Promise.all(checkPromises);
    const checksMap: Record<string, boolean> = {};
    let allReady = true;

    results.forEach(result => {
      checksMap[result.name] = result.ready;
      if (!result.ready) {
        allReady = false;
      }
    });

    return {
      ready: allReady,
      checks: checksMap,
    };
  }

  /**
   * Get liveness status for Kubernetes
   */
  getLivenessStatus(): { alive: boolean; timestamp: Date; uptime: number } {
    // For liveness, just check if the process is running
    return {
      alive: true,
      timestamp: new Date(),
      uptime: process.uptime(),
    };
  }
}

// Export singleton instance
export const healthCheckSystem = new HealthCheckSystem();
export default healthCheckSystem;
