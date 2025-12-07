import fs from 'fs';
import path from 'path';
import { logger } from '../logger';

// Log rotation configuration
export interface LogRotationConfig {
  enabled: boolean;
  maxSize: string; // e.g., '10m', '100m', '1g'
  maxFiles: string; // e.g., '14d', '30d', '10'
  compress: boolean;
  datePattern: string;
  auditFile: string;
  createSymlink: boolean;
  symlinkName: string;
}

// Default log rotation configuration
export const defaultLogRotationConfig: LogRotationConfig = {
  enabled: true,
  maxSize: '20m',
  maxFiles: '14d',
  compress: true,
  datePattern: 'YYYY-MM-DD',
  auditFile: path.join(process.cwd(), 'logs', 'audit.json'),
  createSymlink: true,
  symlinkName: 'current.log',
};

// Setup log rotation
export function setupLogRotation(config: Partial<LogRotationConfig> = {}) {
  const finalConfig = { ...defaultLogRotationConfig, ...config };

  if (!finalConfig.enabled) {
    logger.info('Log rotation is disabled');
    return;
  }

  // Ensure logs directory exists
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Setup log rotation for different log types
  setupLogTypeRotation('application', finalConfig);
  setupLogTypeRotation('error', finalConfig);
  setupLogTypeRotation('http', finalConfig);
  setupLogTypeRotation('audit', finalConfig);
  setupLogTypeRotation('database', finalConfig);
  setupLogTypeRotation('external-api', finalConfig);

  logger.info('Log rotation configured', {
    maxSize: finalConfig.maxSize,
    maxFiles: finalConfig.maxFiles,
    compress: finalConfig.compress,
  });
}

// Setup rotation for specific log type
function setupLogTypeRotation(logType: string, config: LogRotationConfig) {
  const logFile = path.join(process.cwd(), 'logs', `${logType}.log`);

  // Create symlink to current log file
  if (config.createSymlink) {
    const symlinkPath = path.join(process.cwd(), 'logs', `${logType}-${config.symlinkName}`);

    try {
      if (fs.existsSync(symlinkPath)) {
        fs.unlinkSync(symlinkPath);
      }
      fs.symlinkSync(logFile, symlinkPath);
    } catch (error) {
      logger.warn(`Failed to create symlink for ${logType} logs:`, error);
    }
  }
}

// Clean up old log files
export function cleanupOldLogs(maxAgeDays: number = 30) {
  const logsDir = path.join(process.cwd(), 'logs');

  if (!fs.existsSync(logsDir)) {
    return;
  }

  const files = fs.readdirSync(logsDir);
  const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

  files.forEach(file => {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);

    // Only delete old log files (not directories or symlinks)
    if (stats.isFile() && stats.mtimeMs < cutoffTime && file.endsWith('.log')) {
      try {
        fs.unlinkSync(filePath);
        logger.info(`Deleted old log file: ${file}`);
      } catch (error) {
        logger.warn(`Failed to delete old log file ${file}:`, error);
      }
    }
  });
}

// Get log file statistics
export function getLogStatistics() {
  const logsDir = path.join(process.cwd(), 'logs');

  if (!fs.existsSync(logsDir)) {
    return null;
  }

  const files = fs.readdirSync(logsDir);
  const statistics: any = {
    totalFiles: 0,
    totalSize: 0,
    byType: {},
    recentFiles: [],
  };

  files.forEach(file => {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      statistics.totalFiles++;
      statistics.totalSize += stats.size;

      // Categorize by log type
      const match = file.match(/^([a-z-]+)/);
      if (match) {
        const type = match[1];
        if (!statistics.byType[type]) {
          statistics.byType[type] = { count: 0, size: 0 };
        }
        statistics.byType[type].count++;
        statistics.byType[type].size += stats.size;
      }

      // Track recent files
      if (stats.mtimeMs > Date.now() - 24 * 60 * 60 * 1000) {
        statistics.recentFiles.push({
          name: file,
          size: stats.size,
          modified: stats.mtime,
        });
      }
    }
  });

  // Format sizes
  statistics.totalSizeFormatted = formatBytes(statistics.totalSize);
  Object.keys(statistics.byType).forEach(type => {
    statistics.byType[type].sizeFormatted = formatBytes(statistics.byType[type].size);
  });

  return statistics;
}

// Format bytes to human readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Monitor log directory size
export function monitorLogSize(maxSizeMB: number = 1024) {
  const logsDir = path.join(process.cwd(), 'logs');

  if (!fs.existsSync(logsDir)) {
    return;
  }

  const stats = getLogStatistics();
  if (!stats) return;

  const sizeMB = stats.totalSize / (1024 * 1024);

  if (sizeMB > maxSizeMB) {
    logger.warn('Log directory size exceeded threshold', {
      currentSize: stats.totalSizeFormatted,
      maxSize: `${maxSizeMB}MB`,
      threshold: maxSizeMB,
    });

    // Trigger cleanup if size is 110% of max
    if (sizeMB > maxSizeMB * 1.1) {
      logger.info('Triggering log cleanup due to size limit');
      cleanupOldLogs(7); // Keep only last 7 days
    }
  }
}

// Log rotation schedule (run daily)
export function scheduleLogRotation() {
  // Run cleanup at midnight
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);

  const timeUntilMidnight = midnight.getTime() - now.getTime();

  setTimeout(() => {
    cleanupOldLogs();
    monitorLogSize();

    // Schedule next cleanup
    setInterval(
      () => {
        cleanupOldLogs();
        monitorLogSize();
      },
      24 * 60 * 60 * 1000
    ); // Run daily
  }, timeUntilMidnight);

  logger.info('Log rotation scheduled', {
    nextRun: midnight.toISOString(),
  });
}
