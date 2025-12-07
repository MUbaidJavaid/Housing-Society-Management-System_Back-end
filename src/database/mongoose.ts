import mongoose, { ConnectOptions, Mongoose, MongooseError } from 'mongoose';
import config, { getMaskedUri } from '../config/database';
import logger from '../core/logger';

/* ---------------------- Errors ---------------------- */
export class DatabaseConnectionError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
    public retryCount?: number
  ) {
    super(message);
    this.name = 'DatabaseConnectionError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DatabaseQueryError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
    public query?: any
  ) {
    super(message);
    this.name = 'DatabaseQueryError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/* ---------------------- Global Plugin ---------------------- */
// function setupGlobalPlugin() {
//   const plugin = (schema: Schema) => {
//     // Add soft delete fields
//     schema.add({
//       isDeleted: { type: Boolean, default: false },
//       deletedAt: { type: Date, default: null },
//     });

//     // Query helpers
//     schema.query.excludeDeleted = function () {
//       return this.where({ isDeleted: false });
//     };

//     schema.query.onlyDeleted = function () {
//       return this.where({ isDeleted: true });
//     };

//     schema.query.withDeleted = function () {
//       return this;
//     };

//     // Static methods
//     schema.statics.softDelete = function (conditions: any) {
//       return this.updateOne(conditions, {
//         isDeleted: true,
//         deletedAt: new Date(),
//       });
//     };

//     schema.statics.restore = function (conditions: any) {
//       return this.updateOne(conditions, {
//         isDeleted: false,
//         deletedAt: null,
//       });
//     };
//   };

//   mongoose.plugin(plugin);
// }

/* ---------------------- Event Listeners ---------------------- */
function setupEventListeners(healthCheckIntervalRef: { current: NodeJS.Timeout | null }) {
  mongoose.connection.on('connected', () => {
    logger.info(`MongoDB connected to ${getMaskedUri(config.uri)}`);
  });

  mongoose.connection.on('error', (err: MongooseError) => {
    logger.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
    stopHealthCheck(healthCheckIntervalRef);
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
    startHealthCheck(healthCheckIntervalRef);
  });

  mongoose.connection.on('reconnectFailed', () => {
    logger.error('MongoDB reconnect failed');
  });
}

/* ---------------------- Health Check Functions ---------------------- */
function startHealthCheck(healthCheckIntervalRef: { current: NodeJS.Timeout | null }) {
  if (healthCheckIntervalRef.current) {
    clearInterval(healthCheckIntervalRef.current);
  }

  healthCheckIntervalRef.current = setInterval(async () => {
    try {
      await mongoose.connection.db?.admin().ping();
      logger.debug('MongoDB heartbeat OK');
    } catch (err) {
      logger.error('MongoDB heartbeat failed', err);
    }
  }, config.options.heartbeatFrequencyMS);
}

function stopHealthCheck(healthCheckIntervalRef: { current: NodeJS.Timeout | null }) {
  if (healthCheckIntervalRef.current) {
    clearInterval(healthCheckIntervalRef.current);
    healthCheckIntervalRef.current = null;
  }
}

/* ---------------------- Connection Functions ---------------------- */
let isConnecting = false;
let connectionAttempts = 0;
const healthCheckIntervalRef: { current: NodeJS.Timeout | null } = { current: null };

export async function connectWithRetry(): Promise<Mongoose> {
  if (isConnecting) return mongoose;
  if (mongoose.connection.readyState === 1) return mongoose;

  isConnecting = true;

  // Set mongoose settings
  mongoose.set('strictQuery', true);

  if (config.isDevelopment) {
    mongoose.set('debug', (collectionName, method, query, doc) => {
      logger.debug(`Mongoose: ${collectionName}.${method}`, {
        query: JSON.stringify(query),
        doc: JSON.stringify(doc),
      });
    });
  }

  // // Setup global plugin
  // setupGlobalPlugin();

  for (let attempt = 1; attempt <= config.retry.maxRetries; attempt++) {
    try {
      logger.info(`Attempting MongoDB connection (${attempt}/${config.retry.maxRetries})...`);
      await mongoose.connect(config.uri, config.options as ConnectOptions);

      isConnecting = false;
      connectionAttempts = attempt;

      // Setup event listeners
      setupEventListeners(healthCheckIntervalRef);

      // Start health check
      startHealthCheck(healthCheckIntervalRef);

      return mongoose;
    } catch (err) {
      isConnecting = false;
      connectionAttempts = attempt;

      const delay = config.retry.delayMs * Math.pow(config.retry.multiplier, attempt - 1);

      if (attempt === config.retry.maxRetries) {
        throw new DatabaseConnectionError(
          `Failed to connect after ${attempt} attempts`,
          err as Error,
          attempt
        );
      }

      logger.warn(`Attempt ${attempt} failed. Retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw new DatabaseConnectionError('Max retries reached');
}

export async function disconnect(_force?: boolean): Promise<void> {
  stopHealthCheck(healthCheckIntervalRef);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  }
}

/* ---------------------- Health Check Functions ---------------------- */
export async function healthCheck(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    await mongoose.connection.db?.admin().ping();
    return {
      healthy: true,
      latency: Date.now() - start,
    };
  } catch (err) {
    return {
      healthy: false,
      error: (err as Error).message,
    };
  }
}

export async function getStats(): Promise<any> {
  if (!mongoose.connection.db) {
    throw new Error('Database not connected');
  }

  const adminDb = mongoose.connection.db.admin();
  const serverStatus = await adminDb.serverStatus();
  const dbStats = await mongoose.connection.db.stats();

  return {
    server: {
      version: serverStatus.version,
      host: serverStatus.host,
      uptime: serverStatus.uptime,
      connections: serverStatus.connections,
    },
    database: {
      collections: dbStats.collections,
      objects: dbStats.objects,
      dataSize: dbStats.dataSize,
      storageSize: dbStats.storageSize,
      indexSize: dbStats.indexSize,
    },
  };
}

export function getConnectionStatus() {
  return {
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    connectionAttempts,
  };
}

export function startSession() {
  return mongoose.startSession();
}

// Export mongoose instance
export const mongooseInstance = mongoose;
export default mongooseInstance;
