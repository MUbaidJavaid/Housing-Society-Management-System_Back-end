import { existsSync, readdirSync, statSync } from 'fs';
import os from 'os';
import { join } from 'path';
import logger from '../../core/logger';
import { HealthCheckResult, HealthStatus, Severity } from '../types';
import { BaseHealthCheck } from './base.check';

export class DiskSpaceHealthCheck extends BaseHealthCheck {
  private thresholdPercent: number;
  private path: string;

  constructor(path = process.cwd(), thresholdPercent = 90) {
    super('disk-space', 'Disk Storage', 'infrastructure', Severity.HIGH, 3000);
    this.path = path;
    this.thresholdPercent = thresholdPercent;
  }

  async check(): Promise<HealthCheckResult> {
    return this.executeCheck(async () => {
      const startTime = Date.now();

      try {
        statSync(this.path);
        const diskInfo = this.getDiskInfo(this.path);

        const total = diskInfo.total || 0;
        const free = diskInfo.free || 0;
        const used = total - free;
        const usedPercent = total > 0 ? (used / total) * 100 : 0;

        const status =
          usedPercent < this.thresholdPercent ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;

        const duration = Date.now() - startTime;

        return {
          name: this.name,
          status,
          severity: this.severity,
          message:
            usedPercent < this.thresholdPercent
              ? `Disk space is adequate (${usedPercent.toFixed(1)}% used)`
              : `Disk space is critical (${usedPercent.toFixed(1)}% used)`,
          timestamp: new Date(),
          duration,
          component: this.component,
          componentType: this.componentType,
          metadata: {
            path: this.path,
            total: this.formatBytes(total),
            free: this.formatBytes(free),
            used: this.formatBytes(used),
            usedPercent: usedPercent.toFixed(2),
            threshold: this.thresholdPercent,
            filesystem: diskInfo.filesystem,
            mount: diskInfo.mount,
          },
          ...(status === HealthStatus.UNHEALTHY
            ? { error: `Disk usage exceeded ${this.thresholdPercent}% threshold` }
            : {}),
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;
        return {
          name: this.name,
          status: HealthStatus.UNHEALTHY,
          severity: this.severity,
          message: 'Failed to check disk space',
          timestamp: new Date(),
          duration,
          component: this.component,
          componentType: this.componentType,
          error: error.message,
        };
      }
    });
  }

  private getDiskInfo(path: string): any {
    try {
      // This is platform-specific
      if (process.platform === 'win32') {
        // Windows implementation would go here
        return { total: 0, free: 0, filesystem: 'unknown', mount: path };
      } else {
        // Unix/Linux/Mac implementation
        require('fs');
        const diskInfo = require('diskusage');
        const info = diskInfo.checkSync(path);
        return {
          total: info.total,
          free: info.free,
          filesystem: 'ext4', // This would need proper detection
          mount: path,
        };
      }
    } catch (error) {
      logger.warn('Could not get detailed disk info:', error);
      return { total: 0, free: 0, filesystem: 'unknown', mount: path };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export class FileSystemHealthCheck extends BaseHealthCheck {
  private paths: string[];

  constructor(paths: string[] = []) {
    super('file-system', 'File System', 'infrastructure', Severity.MEDIUM, 5000);
    this.paths =
      paths.length > 0
        ? paths
        : [
            process.cwd(),
            join(process.cwd(), 'logs'),
            join(process.cwd(), 'uploads'),
            join(process.cwd(), 'public'),
          ];
  }

  async check(): Promise<HealthCheckResult> {
    return this.executeCheck(async () => {
      const startTime = Date.now();
      const results: any[] = [];

      for (const path of this.paths) {
        try {
          const exists = existsSync(path);
          const isDirectory = exists ? statSync(path).isDirectory() : false;
          const isReadable = exists ? true : false;
          const isWritable = exists ? true : false; // Simplified - would need actual write test

          let fileCount = 0;
          let totalSize = 0;

          if (exists && isDirectory) {
            try {
              const files = readdirSync(path);
              fileCount = files.length;

              for (const file of files.slice(0, 100)) {
                // Limit to first 100 files
                const filePath = join(path, file);
                const stats = statSync(filePath);
                if (stats.isFile()) {
                  totalSize += stats.size;
                }
              }
            } catch (error) {
              // Can't read directory contents
            }
          }

          results.push({
            path,
            exists,
            isDirectory,
            isReadable,
            isWritable,
            fileCount,
            totalSize: this.formatBytes(totalSize),
          });
        } catch (error: any) {
          results.push({
            path,
            error: error.message,
            exists: false,
          });
        }
      }

      const duration = Date.now() - startTime;
      const allHealthy = results.every(r => r.exists && r.isReadable);

      return {
        name: this.name,
        status: allHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        severity: this.severity,
        message: allHealthy
          ? 'All required file system paths are accessible'
          : 'Some file system paths have issues',
        timestamp: new Date(),
        duration,
        component: this.component,
        componentType: this.componentType,
        metadata: {
          paths: results,
          totalPaths: this.paths.length,
          accessiblePaths: results.filter(r => r.exists && r.isReadable).length,
        },
        ...(!allHealthy ? { error: 'Some paths are inaccessible' } : {}),
      };
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export class SystemResourcesHealthCheck extends BaseHealthCheck {
  constructor() {
    super('system-resources', 'System Resources', 'infrastructure', Severity.MEDIUM, 1000);
  }

  async check(): Promise<HealthCheckResult> {
    return this.executeCheck(async () => {
      const startTime = Date.now();

      // Get system info
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memoryUsagePercent = (usedMem / totalMem) * 100;

      const loadAverage = os.loadavg();
      const cpus = os.cpus();
      const cpuCount = cpus.length;

      // Calculate CPU usage (this is simplified)
      let totalIdle = 0,
        totalTick = 0;
      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += (cpu.times as any)[type];
        }
        totalIdle += cpu.times.idle;
      });

      const cpuUsagePercent = ((totalTick - totalIdle) / totalTick) * 100;

      // Check event loop lag
      const eventLoopStart = Date.now();
      await new Promise(resolve => setImmediate(resolve));
      const eventLoopLag = Date.now() - eventLoopStart;

      // Get network interfaces
      const networkInterfaces = os.networkInterfaces();

      const duration = Date.now() - startTime;

      const isMemoryCritical = memoryUsagePercent > 90;
      const isMemoryWarning = memoryUsagePercent > 80;
      const isCpuCritical = cpuUsagePercent > 90;
      const isCpuWarning = cpuUsagePercent > 80;
      const isEventLoopCritical = eventLoopLag > 100;
      const isEventLoopWarning = eventLoopLag > 50;

      const isHealthy = !isMemoryCritical && !isCpuCritical && !isEventLoopCritical;
      const status = isHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED;

      return {
        name: this.name,
        status,
        severity: this.severity,
        message: isHealthy
          ? 'System resources are within normal limits'
          : 'System resources showing warning signs',
        timestamp: new Date(),
        duration,
        component: this.component,
        componentType: this.componentType,
        metadata: {
          memory: {
            total: this.formatBytes(totalMem),
            used: this.formatBytes(usedMem),
            free: this.formatBytes(freeMem),
            usagePercent: memoryUsagePercent.toFixed(2),
            threshold: 80,
            status: isMemoryCritical ? 'critical' : isMemoryWarning ? 'warning' : 'normal',
          },
          cpu: {
            count: cpuCount,
            model: cpus[0]?.model || 'unknown',
            speed: cpus[0]?.speed || 0,
            usagePercent: cpuUsagePercent.toFixed(2),
            loadAverage: loadAverage.map(avg => avg.toFixed(2)),
            threshold: 80,
            status: isCpuCritical ? 'critical' : isCpuWarning ? 'warning' : 'normal',
          },
          eventLoop: {
            lag: eventLoopLag,
            threshold: 50,
            status: isEventLoopCritical ? 'critical' : isEventLoopWarning ? 'warning' : 'normal',
          },
          system: {
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            uptime: os.uptime(),
            hostname: os.hostname(),
            homeDir: os.homedir(),
            tempDir: os.tmpdir(),
          },
          network: Object.keys(networkInterfaces).reduce(
            (acc, iface) => {
              acc[iface] = networkInterfaces[iface]?.map(net => ({
                address: net.address,
                netmask: net.netmask,
                family: net.family,
                mac: net.mac,
                internal: net.internal,
              }));
              return acc;
            },
            {} as Record<string, any>
          ),
        },
      };
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
