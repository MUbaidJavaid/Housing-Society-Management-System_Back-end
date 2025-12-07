import winston from 'winston';
import config from '../config';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom log format
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    config.logging.format === 'json' ? json() : customFormat
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), customFormat),
    }),

    // File transport for errors
    new winston.transports.File({
      filename: `${config.paths.logs}/error.log`,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: `${config.paths.logs}/combined.log`,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],

  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create logs directory if it doesn't exist
import fs from 'fs';

const logsDir = config.paths.logs;
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export default logger;

export class AppLogger {
  constructor(private context?: string) {}

  info(message: string, meta?: any) {
    logger.info(message, { context: this.context, ...meta });
  }

  warn(message: string, meta?: any) {
    logger.warn(message, { context: this.context, ...meta });
  }

  error(message: string, meta?: any) {
    logger.error(message, { context: this.context, ...meta });
  }
}
