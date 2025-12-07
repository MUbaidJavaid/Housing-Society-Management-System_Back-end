import path from 'path';
import winston from 'winston';
import 'winston-daily-rotate-file';
import config from '../config';

// Ensure logs directory exists
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log transports based on environment
export function createTransports() {
  const transports: winston.transport[] = [];
  const isProduction = config.env === 'production';

  // Console transport (development)
  if (!isProduction) {
    transports.push(
      new winston.transports.Console({
        level: 'debug',
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      })
    );
  }

  // Daily rotate file transport for all logs
  transports.push(
    new winston.transports.DailyRotateFile({
      level: 'info',
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d', // Keep logs for 14 days
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    })
  );

  // Error logs (separate file)
  transports.push(
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d', // Keep error logs for 30 days
      handleExceptions: true,
      handleRejections: true,
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    })
  );

  // HTTP logs (separate file)
  transports.push(
    new winston.transports.DailyRotateFile({
      level: 'http',
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d', // Keep HTTP logs for 7 days
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    })
  );

  // Audit logs (for security events)
  transports.push(
    new winston.transports.DailyRotateFile({
      level: 'warn',
      filename: path.join(logsDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '10m',
      maxFiles: '90d', // Keep audit logs for 90 days
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    })
  );

  // Production-only transports
  if (isProduction) {
    // JSON console for production (for log aggregation services)
    transports.push(
      new winston.transports.Console({
        level: 'info',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      })
    );
  }

  return transports;
}

// Create specific transport for database logs
export function createDatabaseTransport() {
  return new winston.transports.DailyRotateFile({
    level: 'debug',
    filename: path.join(logsDir, 'database-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '7d',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  });
}

// Create specific transport for external API calls
export function createExternalApiTransport() {
  return new winston.transports.DailyRotateFile({
    level: 'info',
    filename: path.join(logsDir, 'external-api-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '7d',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  });
}
