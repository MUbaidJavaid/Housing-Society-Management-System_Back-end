import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'staging', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // Security
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'), // 100 requests per window
  BODY_SIZE_LIMIT: z.string().default('10mb'),

  // Compression
  COMPRESSION_ENABLED: z
    .string()
    .transform(val => val === 'true')
    .default('true'),

  // Static files
  STATIC_FILES_PATH: z.string().default('public'),
  STATIC_FILES_MAX_AGE: z.string().transform(Number).default('31536000'), // 1 year
});

// Parse and validate environment variables
const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:', env.error.format());
  process.exit(1);
}

const config = {
  // Server
  env: env.data.NODE_ENV,
  port: env.data.PORT || 3000,
  host: env.data.HOST || 'localhost',
  isDevelopment: env.data.NODE_ENV === 'development',
  isProduction: env.data.NODE_ENV === 'production',
  isStaging: env.data.NODE_ENV === 'staging',
  isTest: env.data.NODE_ENV === 'test',

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'app:',
    // Connection options
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    commandTimeout: 5000,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
  },
  // API
  api: {
    prefix: '/api',
    version: 'v1',
  },

  // Security
  security: {
    cors: {
      origin: env.data.CORS_ORIGIN === '*' ? '*' : env.data.CORS_ORIGIN.split(','),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
    rateLimit: {
      windowMs: env.data.RATE_LIMIT_WINDOW_MS,
      max: env.data.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
    },
    bodyParser: {
      json: {
        limit: env.data.BODY_SIZE_LIMIT,
      },
      urlencoded: {
        limit: env.data.BODY_SIZE_LIMIT,
        extended: true,
      },
    },
  },

  // Compression
  compression: {
    enabled: env.data.COMPRESSION_ENABLED,
    level: 6,
    threshold: 1024, // 1KB
  },

  // Static files
  staticFiles: {
    path: path.join(process.cwd(), env.data.STATIC_FILES_PATH),
    maxAge: env.data.STATIC_FILES_MAX_AGE,
    dotfiles: 'ignore',
    etag: true,
    index: false,
    redirect: false,
  },

  // Paths
  paths: {
    root: process.cwd(),
    public: path.join(process.cwd(), env.data.STATIC_FILES_PATH),
    uploads: path.join(process.cwd(), 'uploads'),
    logs: path.join(process.cwd(), 'logs'),
  },

  // Logging
  logging: {
    level: env.data.NODE_ENV === 'production' ? 'info' : 'debug',
    format: env.data.NODE_ENV === 'production' ? 'json' : 'pretty',
  },
};

export default config;
