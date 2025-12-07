import Redis from 'ioredis';
import { HealthCheckResult, HealthStatus, Severity } from '../types';
import { BaseHealthCheck } from './base.check';

export class RedisHealthCheck extends BaseHealthCheck {
  private redisClient: Redis | null;

  constructor(redisUrl?: string) {
    super('redis-connection', 'Redis Cache', 'external', Severity.HIGH, 3000);

    this.redisClient = redisUrl ? new Redis(redisUrl) : null;
  }

  async check(): Promise<HealthCheckResult> {
    if (!this.redisClient) {
      return {
        name: this.name,
        status: HealthStatus.UNKNOWN,
        severity: Severity.LOW,
        message: 'Redis client not configured',
        timestamp: new Date(),
        duration: 0,
        component: this.component,
        componentType: this.componentType,
        metadata: { configured: false },
      };
    }

    return this.executeCheck(async () => {
      const startTime = Date.now();

      // Ping Redis
      const pingResponse = await this.redisClient!.ping();

      if (pingResponse !== 'PONG') {
        throw new Error('Invalid ping response');
      }

      // Get Redis info
      const info = await this.redisClient!.info();
      const infoLines = info.split('\r\n');
      const infoObj: Record<string, string> = {};

      infoLines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          infoObj[key] = value;
        }
      });

      // Check memory usage
      const usedMemory = parseInt(infoObj.used_memory || '0');
      const maxMemory = parseInt(infoObj.maxmemory || '0');
      const memoryUsage = maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0;

      // Check connected clients
      const connectedClients = parseInt(infoObj.connected_clients || '0');
      const maxClients = parseInt(infoObj.maxclients || '0');
      const clientUsage = maxClients > 0 ? (connectedClients / maxClients) * 100 : 0;

      // Check keyspace
      const keyspaceHits = parseInt(infoObj.keyspace_hits || '0');
      const keyspaceMisses = parseInt(infoObj.keyspace_misses || '0');
      const hitRate =
        keyspaceHits + keyspaceMisses > 0
          ? (keyspaceHits / (keyspaceHits + keyspaceMisses)) * 100
          : 0;

      const duration = Date.now() - startTime;

      const isHealthy = memoryUsage < 90 && clientUsage < 90;

      return {
        name: this.name,
        status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        severity: this.severity,
        message: isHealthy ? 'Redis is healthy' : 'Redis shows warning signs',
        timestamp: new Date(),
        duration,
        component: this.component,
        componentType: this.componentType,
        metadata: {
          version: infoObj.redis_version,
          mode: infoObj.redis_mode,
          uptime: parseInt(infoObj.uptime_in_seconds || '0'),
          memory: {
            used: usedMemory,
            max: maxMemory,
            usagePercentage: memoryUsage.toFixed(2),
            fragmentationRatio: parseFloat(infoObj.mem_fragmentation_ratio || '0'),
          },
          clients: {
            connected: connectedClients,
            max: maxClients,
            usagePercentage: clientUsage.toFixed(2),
          },
          performance: {
            hitRate: hitRate.toFixed(2),
            instantaneousOpsPerSec: parseInt(infoObj.instantaneous_ops_per_sec || '0'),
            totalCommandsProcessed: parseInt(infoObj.total_commands_processed || '0'),
          },
          persistence: {
            rdbLastSaveTime: parseInt(infoObj.rdb_last_save_time || '0'),
            aofEnabled: infoObj.aof_enabled === '1',
          },
          replication: {
            role: infoObj.role,
            connectedSlaves: parseInt(infoObj.connected_slaves || '0'),
          },
          latency: duration,
          warnings: memoryUsage >= 90 ? ['High memory usage'] : [],
        },
      };
    });
  }

  async checkMemory(): Promise<HealthCheckResult> {
    if (!this.redisClient) {
      return {
        name: 'redis-memory',
        status: HealthStatus.UNKNOWN,
        severity: Severity.LOW,
        message: 'Redis client not configured',
        timestamp: new Date(),
        duration: 0,
        component: this.component,
        componentType: this.componentType,
      };
    }

    return this.executeCheck(async () => {
      const memoryInfo = await this.redisClient!.info('memory');
      const memoryLines = memoryInfo.split('\r\n');
      const memoryObj: Record<string, string> = {};

      memoryLines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          memoryObj[key] = value;
        }
      });

      const usedMemory = parseInt(memoryObj.used_memory || '0');
      const usedMemoryRss = parseInt(memoryObj.used_memory_rss || '0');
      const maxMemory = parseInt(memoryObj.maxmemory || '0');

      const memoryUsage = maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0;
      const fragmentation = usedMemoryRss > 0 ? usedMemoryRss / usedMemory : 0;

      const status =
        memoryUsage > 95
          ? HealthStatus.UNHEALTHY
          : memoryUsage > 80
            ? HealthStatus.DEGRADED
            : HealthStatus.HEALTHY;

      return {
        name: 'redis-memory',
        status,
        severity: Severity.HIGH,
        message:
          memoryUsage > 95
            ? 'Redis memory critically high'
            : memoryUsage > 80
              ? 'Redis memory usage high'
              : 'Redis memory usage is normal',
        timestamp: new Date(),
        duration: 0,
        component: this.component,
        componentType: this.componentType,
        metadata: {
          usedMemory,
          usedMemoryRss,
          maxMemory,
          memoryUsage: memoryUsage.toFixed(2),
          fragmentationRatio: fragmentation.toFixed(2),
          memoryOverhead: parseInt(memoryObj.used_memory_overhead || '0'),
          datasetBytes: parseInt(memoryObj.used_memory_dataset || '0'),
        },
      };
    });
  }

  /**
   * Clean up Redis connection
   */
  disconnect(): void {
    if (this.redisClient) {
      this.redisClient.quit();
      this.redisClient = null;
    }
  }
}
