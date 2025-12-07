import winston from 'winston';
import config from '../config';
import { createFormats } from './formats';
import { createTransports } from './transports';

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Create logger instance
export function createLogger() {
  const isDevelopment = config.env === 'development';
  const isProduction = config.env === 'production';
  const isTest = config.env === 'test';

  // Create logger
  const logger = winston.createLogger({
    level: isDevelopment ? 'debug' : isProduction ? 'info' : 'warn',
    levels,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      ...createFormats()
    ),
    transports: createTransports(),
    // Don't exit on handled exceptions
    exitOnError: false,
    // Handle uncaught exceptions
    handleExceptions: true,
    handleRejections: true,
  });

  // If not in production, log to console with colors
  if (!isProduction && !isTest) {
    logger.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({ all: true }),
          winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
        ),
      })
    );
  }

  return logger;
}

// Export singleton logger instance
export const logger = createLogger();

// Helper functions
export function logError(error: Error, context?: string, metadata?: any) {
  logger.error(`${context ? context + ': ' : ''}${error.message}`, {
    error: error.message,
    stack: error.stack,
    ...metadata,
  });
}

export function logInfo(message: string, metadata?: any) {
  logger.info(message, metadata);
}

export function logWarn(message: string, metadata?: any) {
  logger.warn(message, metadata);
}

export function logDebug(message: string, metadata?: any) {
  logger.debug(message, metadata);
}

export function logHttp(message: string, metadata?: any) {
  logger.http(message, metadata);
}

export function logDatabase(query: string, duration: number, collection?: string) {
  logger.debug(`Database query: ${query}`, {
    query,
    duration,
    collection,
    type: 'database',
  });
}

export function logRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  metadata?: any
) {
  logger.http(`${method} ${url} ${statusCode} ${duration}ms`, {
    method,
    url,
    statusCode,
    duration,
    ...metadata,
  });
}

export function logSecurity(event: string, metadata?: any) {
  logger.warn(`Security event: ${event}`, {
    event,
    type: 'security',
    ...metadata,
  });
}

export function logPerformance(operation: string, duration: number, metadata?: any) {
  logger.info(`Performance: ${operation} took ${duration}ms`, {
    operation,
    duration,
    type: 'performance',
    ...metadata,
  });
}

// Stream for Morgan HTTP logger
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
