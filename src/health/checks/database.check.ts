// File: health/checks/database.check.ts
import mongoose from 'mongoose';
import logger from '../../core/logger';
import { DatabaseConnectionState, databaseManager } from '../../database/index';
import { HealthCheckResult, HealthStatus, Severity } from '../types';
import { BaseHealthCheck } from './base.check';

export class DatabaseHealthCheck extends BaseHealthCheck {
  constructor() {
    super(
      'mongodb-connection',
      'MongoDB Database',
      DatabaseConnectionState.INTERNAL,
      Severity.CRITICAL,
      10000
    );
  }

  async check(): Promise<HealthCheckResult> {
    return this.executeCheck(async () => {
      const startTime = Date.now();

      // Check connection status
      const isConnected = databaseManager.isConnected();

      if (!isConnected) {
        throw new Error('Database not connected');
      }

      // Safely get database connection
      const connection = mongoose.connection;
      const db = connection.db;

      if (!db) {
        throw new Error('Database instance not available');
      }

      // Get database stats
      const adminDb = db.admin();
      const [serverStatus, dbStats] = await Promise.all([
        adminDb.serverStatus().catch(() => null),
        db.stats().catch(() => null),
      ]);

      // Check connection pool
      const readyState = connection.readyState;
      const poolSize = (connection as any).poolSize || 0;
      const currentConnections = (connection as any).connections?.length || 0;

      // Check for slow queries or operations
      const collections = await db.listCollections().toArray();
      const collectionCount = collections.length;

      const duration = Date.now() - startTime;

      return {
        name: this.name,
        status: HealthStatus.HEALTHY,
        severity: this.severity,
        message: 'Database connection is healthy',
        timestamp: new Date(),
        duration,
        component: this.component,
        componentType: this.componentType,
        metadata: {
          readyState: this.getReadyStateName(readyState),
          poolSize,
          currentConnections,
          collectionCount,
          databaseName: db.databaseName,
          serverStatus: serverStatus
            ? {
                version: serverStatus.version,
                host: serverStatus.host,
                uptime: serverStatus.uptime,
                connections: serverStatus.connections,
              }
            : null,
          dbStats: dbStats
            ? {
                collections: dbStats.collections,
                objects: dbStats.objects,
                dataSize: dbStats.dataSize,
                storageSize: dbStats.storageSize,
                indexSize: dbStats.indexSize,
              }
            : null,
          collections: collections.map((c: any) => c.name).slice(0, 10),
          latency: duration,
        },
      };
    });
  }

  private getReadyStateName(state: number): string {
    switch (state) {
      case 0:
        return 'disconnected';
      case 1:
        return 'connected';
      case 2:
        return 'connecting';
      case 3:
        return 'disconnecting';
      default:
        return 'unknown';
    }
  }

  /**
   * Additional database-specific health checks
   */
  // In your checkPerformance() method, fix the currentOps handling:
  async checkPerformance(): Promise<HealthCheckResult> {
    return this.executeCheck(async () => {
      const startTime = Date.now();

      // Safely get database connection
      const connection = mongoose.connection;
      const db = connection.db;

      if (!db) {
        throw new Error('Database instance not available');
      }

      const adminDb = db.admin();

      // Ping the database
      await adminDb.ping();

      // Check index usage (sample)
      const usersCollection = db.collection('users');
      const indexStats = await usersCollection.indexInformation().catch(() => ({}));

      // Check for long-running operations - fix the type
      const currentOpsResult = await adminDb
        .command({ currentOp: 1, active: true })
        .catch(() => ({}));

      // Type-safe way to get active operations
      let activeOperations = 0;
      if (
        currentOpsResult &&
        typeof currentOpsResult === 'object' &&
        'inprog' in currentOpsResult
      ) {
        activeOperations = Array.isArray(currentOpsResult.inprog)
          ? currentOpsResult.inprog.length
          : 0;
      }

      const duration = Date.now() - startTime;

      return {
        name: 'mongodb-performance',
        status: duration < 100 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        severity: Severity.MEDIUM,
        message: duration < 100 ? 'Database performance is good' : 'Database response time is slow',
        timestamp: new Date(),
        duration,
        component: this.component,
        componentType: this.componentType,
        metadata: {
          pingLatency: duration,
          hasIndexes: Object.keys(indexStats).length > 0,
          activeOperations,
          warning: duration > 100 ? 'High latency detected' : undefined,
        },
      };
    });
  }

  async checkReplication(): Promise<HealthCheckResult> {
    return this.executeCheck(async () => {
      // Safely get database connection
      const connection = mongoose.connection;
      const db = connection.db;

      if (!db) {
        throw new Error('Database instance not available');
      }

      const adminDb = db.admin();

      try {
        // Check replication status (for replica sets)
        const replStatus = await adminDb.command({ replSetGetStatus: 1 }).catch(() => null);

        if (!replStatus) {
          return {
            name: 'mongodb-replication',
            status: HealthStatus.UNKNOWN,
            severity: Severity.LOW,
            message: 'Not a replica set or replication status unavailable',
            timestamp: new Date(),
            duration: 0,
            component: this.component,
            componentType: this.componentType,
          };
        }

        const members = replStatus.members || [];
        const healthyMembers = members.filter((m: any) => m.health === 1);
        const primary = members.find((m: any) => m.stateStr === 'PRIMARY');
        const secondaries = members.filter((m: any) => m.stateStr === 'SECONDARY');

        const isHealthy = healthyMembers.length === members.length && primary;

        return {
          name: 'mongodb-replication',
          status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
          severity: Severity.HIGH,
          message: isHealthy ? 'Replication is healthy' : 'Replication issues detected',
          timestamp: new Date(),
          duration: 0,
          component: this.component,
          componentType: this.componentType,
          metadata: {
            setName: replStatus.set,
            members: members.length,
            healthyMembers: healthyMembers.length,
            hasPrimary: !!primary,
            secondaries: secondaries.length,
            optime: replStatus.optime,
            electionDate: replStatus.electionDate,
          },
        };
      } catch (error: any) {
        logger.warn('Replication check failed:', error.message);
        return {
          name: 'mongodb-replication',
          status: HealthStatus.UNKNOWN,
          severity: Severity.LOW,
          message: 'Replication status check unavailable',
          timestamp: new Date(),
          duration: 0,
          component: this.component,
          componentType: this.componentType,
          error: error.message,
        };
      }
    });
  }
}
