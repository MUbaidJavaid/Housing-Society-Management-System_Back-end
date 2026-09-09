import { statfsSync } from 'fs';
import mongoose from 'mongoose';
import os from 'os';
import path from 'path';
import { Request, Response } from 'express';
import packageJson from '../../package.json';
import { getApiTrafficStats } from '../middleware/response-time';

const bytes = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const pct = (used: number, total: number): number => {
  if (!total) return 0;
  return Math.min(100, Math.max(0, (used / total) * 100));
};

const mongoStateName = (state: number): string => {
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
};

function readDisk(target = process.cwd()) {
  try {
    const stats = statfsSync(target);
    const total = Number(stats.blocks) * Number(stats.bsize);
    const free = Number(stats.bavail) * Number(stats.bsize);
    const used = Math.max(0, total - free);
    return {
      path: target,
      total,
      used,
      free,
      usedPercent: pct(used, total),
      totalLabel: bytes(total),
      usedLabel: bytes(used),
      freeLabel: bytes(free),
    };
  } catch {
    return null;
  }
}

type CheckStatus = 'healthy' | 'degraded' | 'unhealthy';

function checkStatus(ok: boolean, warn = false): CheckStatus {
  if (!ok) return 'unhealthy';
  if (warn) return 'degraded';
  return 'healthy';
}

function overallStatus(checks: Array<{ status: string }>): CheckStatus {
  if (checks.some(c => c.status === 'unhealthy')) return 'unhealthy';
  if (checks.some(c => c.status === 'degraded')) return 'degraded';
  return 'healthy';
}

export function wantsHtmlDashboard(req: Request): boolean {
  const format = String(req.query.format || '').toLowerCase();
  if (format === 'json' || format === 'api') return false;
  const accept = req.get('accept') || '';
  if (accept.includes('text/html')) return true;
  if (accept.includes('application/json') && !accept.includes('text/html')) return false;
  return true;
}

export function sendHealthDashboard(_req: Request, res: Response): void {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.type('html');
  res.sendFile(path.join(process.cwd(), 'public', 'health', 'index.html'));
}

export async function buildHealthOverview() {
  const started = Date.now();
  const loopStart = Date.now();
  await new Promise<void>(resolve => setImmediate(resolve));
  const eventLoopDelay = Date.now() - loopStart;

  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpus = os.cpus();
  const load = os.loadavg();
  const traffic = getApiTrafficStats();
  const disk = readDisk(process.cwd());

  let mongo: Record<string, unknown> = {
    state: mongoStateName(mongoose.connection.readyState),
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'localhost',
    name: mongoose.connection.name || 'hsms',
  };

  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const pingStart = Date.now();
      await mongoose.connection.db.admin().ping();
      const dbStats = await mongoose.connection.db.stats().catch(() => null);
      mongo = {
        ...mongo,
        pingMs: Date.now() - pingStart,
        collections: dbStats?.collections ?? null,
        objects: dbStats?.objects ?? null,
        dataSize: dbStats?.dataSize ?? null,
        dataSizeLabel: dbStats?.dataSize ? bytes(dbStats.dataSize) : null,
        storageSize: dbStats?.storageSize ?? null,
        storageSizeLabel: dbStats?.storageSize ? bytes(dbStats.storageSize) : null,
        indexSize: dbStats?.indexSize ?? null,
        indexSizeLabel: dbStats?.indexSize ? bytes(dbStats.indexSize) : null,
      };
    }
  } catch (error: unknown) {
    mongo = {
      ...mongo,
      error: error instanceof Error ? error.message : 'MongoDB stats unavailable',
    };
  }

  const heapPct = pct(mem.heapUsed, mem.heapTotal);
  const rssPct = pct(mem.rss, totalMem);
  const ramPct = pct(usedMem, totalMem);
  const loadPct = cpus.length ? pct(load[0], cpus.length) : 0;
  const mongoUp = mongo.readyState === 1;
  const diskPct = disk?.usedPercent ?? 0;

  const checks = [
    {
      name: 'api',
      component: 'HTTP API',
      status: checkStatus(true, (traffic.errorRate || 0) > 5),
      severity: 'critical',
      message: 'Express server is accepting traffic',
      duration: Date.now() - started,
      type: 'internal',
    },
    {
      name: 'mongodb',
      component: 'MongoDB',
      status: checkStatus(mongoUp),
      severity: 'critical',
      message: mongoUp
        ? `Connected · ping ${mongo.pingMs ?? 0}ms`
        : 'Database is not connected',
      duration: typeof mongo.pingMs === 'number' ? mongo.pingMs : 0,
      type: 'internal',
    },
    {
      name: 'process-heap',
      component: 'Process heap',
      status: checkStatus(heapPct < 95, heapPct >= 80),
      severity: 'high',
      message: `${bytes(mem.heapUsed)} / ${bytes(mem.heapTotal)} (${heapPct.toFixed(1)}%)`,
      duration: 0,
      type: 'infrastructure',
    },
    {
      name: 'host-ram',
      component: 'Host RAM',
      status: checkStatus(ramPct < 98, ramPct >= 85),
      severity: 'medium',
      message: `${bytes(usedMem)} / ${bytes(totalMem)} (${ramPct.toFixed(1)}%)`,
      duration: 0,
      type: 'infrastructure',
    },
    {
      name: 'cpu-load',
      component: 'CPU load',
      status: checkStatus(true, loadPct >= 100),
      severity: 'medium',
      message: `1m load ${load[0].toFixed(2)} on ${cpus.length} cores`,
      duration: 0,
      type: 'infrastructure',
    },
    {
      name: 'disk',
      component: 'Disk',
      status: disk ? checkStatus(diskPct < 95, diskPct >= 85) : 'degraded',
      severity: 'high',
      message: disk ? `${disk.usedLabel} / ${disk.totalLabel} (${diskPct.toFixed(1)}%)` : 'Disk metrics unavailable',
      duration: 0,
      type: 'infrastructure',
    },
    {
      name: 'event-loop',
      component: 'Event loop',
      status: checkStatus(eventLoopDelay < 100, eventLoopDelay >= 50),
      severity: 'medium',
      message: `Delay ${eventLoopDelay}ms`,
      duration: eventLoopDelay,
      type: 'infrastructure',
    },
  ];

  const status = overallStatus(checks);
  const summary = {
    total: checks.length,
    healthy: checks.filter(c => c.status === 'healthy').length,
    unhealthy: checks.filter(c => c.status === 'unhealthy').length,
    degraded: checks.filter(c => c.status === 'degraded').length,
    unknown: 0,
  };

  return {
    service: process.env.APP_NAME || 'Housing Society Management System',
    version: packageJson.version || '1.0.0',
    status,
    message:
      status === 'healthy'
        ? 'All systems operational'
        : status === 'degraded'
          ? 'Operational with resource warnings'
          : 'Service is unhealthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    responseTime: Date.now() - started,
    server: {
      hostname: os.hostname(),
      pid: process.pid,
      node: process.version,
      platform: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      cpuModel: cpus[0]?.model?.trim() || 'unknown',
      cpuCores: cpus.length,
      processUptimeSec: process.uptime(),
      systemUptimeSec: os.uptime(),
    },
    memory: {
      process: {
        rss: mem.rss,
        rssLabel: bytes(mem.rss),
        heapUsed: mem.heapUsed,
        heapUsedLabel: bytes(mem.heapUsed),
        heapTotal: mem.heapTotal,
        heapTotalLabel: bytes(mem.heapTotal),
        external: mem.external,
        externalLabel: bytes(mem.external),
        arrayBuffers: mem.arrayBuffers,
        heapPercent: heapPct,
        rssPercentOfSystem: rssPct,
      },
      system: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        totalLabel: bytes(totalMem),
        usedLabel: bytes(usedMem),
        freeLabel: bytes(freeMem),
        usedPercent: ramPct,
      },
    },
    cpu: {
      cores: cpus.length,
      model: cpus[0]?.model?.trim() || 'unknown',
      speedMhz: cpus[0]?.speed || 0,
      loadAvg: load,
      loadPercent: loadPct,
      processCpu: {
        userMs: cpu.user / 1000,
        systemMs: cpu.system / 1000,
      },
    },
    disk,
    eventLoopDelay,
    handles: (process as any)._getActiveHandles?.()?.length || 0,
    activeRequests: (process as any)._getActiveRequests?.()?.length || 0,
    api: traffic,
    mongo,
    redis: {
      configured: Boolean(process.env.REDIS_URL || process.env.REDIS_HOST),
      mode: process.env.REDIS_URL || process.env.REDIS_HOST ? 'redis' : 'in-memory fallback',
    },
    checks,
    summary,
    links: {
      json: '/health?format=json',
      overview: '/health/overview',
      live: '/health/live',
      ready: '/health/ready',
      docs: '/api-docs',
      ping: '/ping',
    },
  };
}
