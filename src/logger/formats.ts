import winston from 'winston';

// Create custom log formats
export function createFormats() {
  const formats = [];

  // Add timestamp
  formats.push(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }));

  // Custom JSON format for production
  formats.push(
    winston.format(info => {
      // Add service name
      info.service = process.env.SERVICE_NAME || 'express-api';

      // Add environment
      info.env = process.env.NODE_ENV || 'development';

      // Add process info
      info.pid = process.pid;

      // Add hostname
      info.hostname = require('os').hostname();

      // Handle error objects
      if (info.error instanceof Error) {
        info.error = {
          message: info.error.message,
          stack: info.error.stack,
          name: info.error.name,
        };
      }

      return info;
    })()
  );

  // JSON format
  formats.push(
    winston.format.json({
      space: 0,
      replacer: (key, value) => {
        // Handle circular references
        if (key === 'stack' && typeof value === 'string') {
          return value.split('\n').slice(0, 5).join('\n'); // Limit stack trace
        }
        return value;
      },
    })
  );

  return formats;
}

// Pretty format for development
export function createPrettyFormat() {
  return winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(info => {
      const { timestamp, level, message, ...meta } = info;

      let metaString = '';
      if (Object.keys(meta).length > 0) {
        // Don't show timestamp in meta if it's already in the message
        if (meta.timestamp) delete meta.timestamp;
        if (Object.keys(meta).length > 0) {
          metaString = ' ' + JSON.stringify(meta, null, 2);
        }
      }

      return `${timestamp} ${level}: ${message}${metaString}`;
    })
  );
}

// HTTP request log format
export function createHttpFormat() {
  return winston.format.printf(info => {
    const { method, url, status, responseTime, ip, userAgent } = info;
    return `${method} ${url} ${status} ${responseTime}ms - ${ip} "${userAgent}"`;
  });
}

// Error log format
export function createErrorFormat() {
  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );
}

// Database query format
export function createDatabaseFormat() {
  return winston.format.printf(info => {
    const { timestamp, collection, operation, duration, query } = info;
    return `${timestamp} [${collection}.${operation}] ${duration}ms - ${JSON.stringify(query)}`;
  });
}
