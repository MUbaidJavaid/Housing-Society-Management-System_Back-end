import cors from 'cors';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { xss } from 'express-xss-sanitizer';
import helmet from 'helmet';
import hpp from 'hpp';
import logger from '.././core/logger';
import config from '../config';

/**
 * Security middleware configuration
 */
export const securityMiddleware: RequestHandler[] = [
  // 1. Set security HTTP headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),

  // 2. Enable CORS
  cors(config.security.cors),
  xss(),
  // 3. Rate limiting
  rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.max,
    standardHeaders: config.security.rateLimit.standardHeaders,
    legacyHeaders: config.security.rateLimit.legacyHeaders,
    message: config.security.rateLimit.message,
    skipSuccessfulRequests: config.security.rateLimit.skipSuccessfulRequests,
    handler: (req: Request, res: Response, _next: NextFunction, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
  }),

  // 4. Body parser - JSON
  (req: Request, res: Response, next: NextFunction) => {
    // Custom body size limit handler
    const jsonMiddleware = require('express').json(config.security.bodyParser.json);
    jsonMiddleware(req, res, (err: any) => {
      if (err && err.type === 'entity.too.large') {
        logger.warn(`Request body too large from IP: ${req.ip}`);
        res.status(413).json({
          success: false,
          message: 'Request body too large',
          limit: config.security.bodyParser.json.limit,
        });
        return;
      }
      next(err);
    });
  },

  // 5. Body parser - URL encoded
  (req: Request, res: Response, next: NextFunction) => {
    const urlencodedMiddleware = require('express').urlencoded(
      config.security.bodyParser.urlencoded
    );
    urlencodedMiddleware(req, res, (err: any) => {
      if (err && err.type === 'entity.too.large') {
        logger.warn(`Request body too large from IP: ${req.ip}`);
        res.status(413).json({
          success: false,
          message: 'Request body too large',
          limit: config.security.bodyParser.urlencoded.limit,
        });
        return;
      }
      next(err);
    });
  },

  // 6. Data sanitization against NoSQL query injection
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }: { req: Request; key: string }) => {
      logger.warn(`Sanitized NoSQL injection attempt from IP: ${req.ip}, key: ${key}`);
    },
  }),

  // 7. Data sanitization against XSS
  //   (req: Request, res: Response, next: NextFunction) => {
  //     // Sanitize request body
  //     if (req.body) {
  //       req.body = sanitizeObject(req.body);
  //     }

  //     // Sanitize request query
  //     if (req.query) {
  //       req.query = sanitizeObject(req.query);
  //     }

  //     // Sanitize request params
  //     if (req.params) {
  //       req.params = sanitizeObject(req.params);
  //     }

  //     next();
  //   },

  // 8. Prevent parameter pollution
  hpp({
    whitelist: ['page', 'limit', 'sort', 'fields', 'search'],
  }),
];

/**
 * Custom XSS sanitizer for objects
 */
// function sanitizeObject(obj: any): any {
//   if (!obj || typeof obj !== 'object') return obj;

//   if (Array.isArray(obj)) {
//     return obj.map(item => sanitizeObject(item));
//   }

//   const sanitized: any = {};
//   for (const [key, value] of Object.entries(obj)) {
//     if (typeof value === 'string') {
//       sanitized[key] = xss(value);
//     } else if (typeof value === 'object' && value !== null) {
//       sanitized[key] = sanitizeObject(value);
//     } else {
//       sanitized[key] = value;
//     }
//   }
//   return sanitized;
// }

/**
 * Request logging middleware
 */
// export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
//   const start = Date.now();

//   // Log request
//   logger.info({
//     method: req.method,
//     url: req.url,
//     ip: req.ip,
//     userAgent: req.get('user-agent'),
//   });

//   // Log response
//   res.on('finish', () => {
//     const duration = Date.now() - start;
//     logger.info({
//       method: req.method,
//       url: req.url,
//       status: res.statusCode,
//       duration: `${duration}ms`,
//       ip: req.ip,
//     });
//   });

//   next();
// };
// Request logging middleware - should NOT be a factory function
export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};

// Or if you want a factory function:
export const createRequestLogger = () => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  };
};
/**
 * Security headers middleware
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};
