import dotenv from 'dotenv';
import { ConnectOptions } from 'mongoose';
import { z } from 'zod';

dotenv.config();

// Database configuration schema
const databaseSchema = z.object({
  MONGODB_URI: z.string().min(1),
  MONGODB_URI_DEV: z.string().optional(),
  MONGODB_URI_PROD: z.string().optional(),
  MONGODB_URI_STAGING: z.string().optional(),
  MONGODB_URI_TEST: z.string().optional(),

  MONGODB_POOL_SIZE: z.string().transform(Number).default('10'),
  MONGODB_SOCKET_TIMEOUT_MS: z.string().transform(Number).default('45000'),
  MONGODB_CONNECT_TIMEOUT_MS: z.string().transform(Number).default('30000'),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.string().transform(Number).default('30000'),

  MONGODB_MAX_RETRIES: z.string().transform(Number).default('3'),
  MONGODB_RETRY_DELAY_MS: z.string().transform(Number).default('5000'),
  MONGODB_RETRY_MULTIPLIER: z.string().transform(Number).default('2'),

  MONGODB_HEARTBEAT_FREQUENCY_MS: z.string().transform(Number).default('10000'),
  MONGODB_MAX_IDLE_TIME_MS: z.string().transform(Number).default('30000'),

  MONGODB_SSL: z
    .string()
    .transform(val => val === 'true')
    .default('false'),
  MONGODB_TLS_ALLOW_INVALID_CERTIFICATES: z
    .string()
    .transform(val => val === 'true')
    .default('false'),

  MONGODB_AUTH_SOURCE: z.string().default('admin'),
  MONGODB_AUTH_MECHANISM: z.enum(['SCRAM-SHA-1', 'SCRAM-SHA-256', 'MONGODB-X509']).optional(),

  MONGODB_W_TIMEOUT_MS: z.string().transform(Number).default('25000'),
  MONGODB_JOURNAL: z
    .string()
    .transform(val => val === 'true')
    .default('true'),
  MONGODB_W: z.string().default('majority'),
});

// Parse and validate env
const env = databaseSchema.safeParse(process.env);
if (!env.success) {
  console.error('❌ Invalid database environment variables:', env.error.format());
  process.exit(1);
}

// Determine URI based on NODE_ENV
const uri = (() => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  switch (nodeEnv) {
    case 'production':
      return env.data.MONGODB_URI_PROD || env.data.MONGODB_URI;
    case 'staging':
      return env.data.MONGODB_URI_STAGING || env.data.MONGODB_URI;
    case 'test':
      return env.data.MONGODB_URI_TEST || `test_${env.data.MONGODB_URI}`;
    case 'development':
    default:
      return env.data.MONGODB_URI_DEV || env.data.MONGODB_URI;
  }
})();

// Validate URI
if (!uri.startsWith('mongodb')) {
  console.error('❌ Invalid MongoDB URI. Must start with "mongodb" or "mongodb+srv"');
  process.exit(1);
}

// Mask URI utility
export const getMaskedUri = (uri: string): string => {
  try {
    const url = new URL(uri);
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  }
};

export interface DatabaseConfig {
  uri: string;
  options: ConnectOptions & {
    maxPoolSize: number;
    heartbeatFrequencyMS: number;
  };
  env: string;
  isTest: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  retry: { maxRetries: number; delayMs: number; multiplier: number };
}

// Final config object
const config: DatabaseConfig = {
  uri,
  options: {
    maxPoolSize: env.data.MONGODB_POOL_SIZE,
    socketTimeoutMS: env.data.MONGODB_SOCKET_TIMEOUT_MS,
    connectTimeoutMS: env.data.MONGODB_CONNECT_TIMEOUT_MS,
    serverSelectionTimeoutMS: env.data.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    heartbeatFrequencyMS: env.data.MONGODB_HEARTBEAT_FREQUENCY_MS,
    maxIdleTimeMS: env.data.MONGODB_MAX_IDLE_TIME_MS,
    ssl: env.data.MONGODB_SSL,
    tlsAllowInvalidCertificates: env.data.MONGODB_TLS_ALLOW_INVALID_CERTIFICATES,
    authSource: env.data.MONGODB_AUTH_SOURCE,
    authMechanism: env.data.MONGODB_AUTH_MECHANISM,

    // ✅ Use writeConcern object
    writeConcern: {
      w: env.data.MONGODB_W as any, // e.g., "majority" or number
      wtimeout: env.data.MONGODB_W_TIMEOUT_MS,
      j: env.data.MONGODB_JOURNAL,
    },
  },

  retry: {
    maxRetries: env.data.MONGODB_MAX_RETRIES,
    delayMs: env.data.MONGODB_RETRY_DELAY_MS,
    multiplier: env.data.MONGODB_RETRY_MULTIPLIER,
  },
  env: process.env.NODE_ENV || 'development',
  isTest: process.env.NODE_ENV === 'test',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;
