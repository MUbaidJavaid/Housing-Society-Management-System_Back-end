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

  transports.push(
    new winston.transports.Console({
      level: isProduction ? 'info' : process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    })
  );

  if (isProduction) {
    transports.push(
      new winston.transports.DailyRotateFile({
        level: 'error',
        filename: path.join(logsDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        handleExceptions: true,
        handleRejections: true,
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      })
    );
  }

  if (isProduction) {
    transports.push(
      new winston.transports.DailyRotateFile({
        level: 'info',
        filename: path.join(logsDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
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
