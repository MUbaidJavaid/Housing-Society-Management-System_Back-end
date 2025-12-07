// Health check status
export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
  UNKNOWN = 'unknown',
}

// Health check severity
export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

// Health check result
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  severity: Severity;
  message: string;
  timestamp: Date;
  duration: number; // in milliseconds
  metadata?: Record<string, any>;
  error?: string;
  component?: string;
  componentType: 'internal' | 'external' | 'infrastructure';
}

// Health check response
export interface HealthResponse {
  status: HealthStatus;
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  responseTime: number;
  checks: Record<string, HealthCheckResult>;
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
    unknown: number;
  };
  metrics?: {
    memory: NodeJS.MemoryUsage;
    cpu?: NodeJS.CpuUsage;
    eventLoopDelay?: number;
    activeHandles?: number;
    activeRequests?: number;
  };
  info?: {
    nodeVersion: string;
    platform: string;
    arch: string;
    pid: number;
    hostname: string;
  };
}

// Health check configuration
export interface HealthCheckConfig {
  enabled: boolean;
  timeout: number; // in milliseconds
  cacheDuration: number; // in milliseconds
  detailed: boolean;
  exposeEnvironment: boolean;
  exposeVersion: boolean;
  exposeMetrics: boolean;
  customChecks: string[];
}

// Custom health check function
export type HealthCheckFunction = () => Promise<HealthCheckResult>;

// Registered health checks
export interface RegisteredCheck {
  name: string;
  check: HealthCheckFunction;
  interval?: number; // for periodic checks
  timeout?: number;
  severity?: Severity;
  component?: string;
  componentType: 'internal' | 'external' | 'infrastructure';
}

// API version information
export interface ApiVersion {
  version: string;
  name: string;
  description?: string;
  changelog?: string;
  documentation?: string;
  supportedUntil?: Date;
  deprecated?: boolean;
  endpoints?: string[];
}

// Service dependencies
export interface ServiceDependency {
  name: string;
  type: 'database' | 'cache' | 'queue' | 'api' | 'storage' | 'other';
  url: string;
  description?: string;
  required: boolean;
  healthEndpoint?: string;
}
