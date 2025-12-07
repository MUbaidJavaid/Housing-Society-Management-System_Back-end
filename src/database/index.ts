// File: database/index.ts
import config, { getMaskedUri } from '../config/database';
import logger from '../core/logger';
import * as mongooseFunctions from './mongoose';

// Database connection states
export enum DatabaseConnectionState {
  INTERNAL = 'internal',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTING = 'DISCONNECTING',
  ERROR = 'ERROR',
}

// State management
let state: DatabaseConnectionState = DatabaseConnectionState.DISCONNECTED;
let connectionStartTime: Date | null = null;
let lastHealthCheck: Date | null = null;
let healthCheckInterval: NodeJS.Timeout | null = null;

/* ---------------------- Setup Functions ---------------------- */
function setupGracefulShutdown(): void {
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    state = DatabaseConnectionState.DISCONNECTING;

    try {
      await disconnect();
      logger.info('Database disconnected gracefully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', async error => {
    logger.error('Uncaught exception:', error);
    await gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', async reason => {
    logger.error('Unhandled rejection:', reason);
    await gracefulShutdown('UNHANDLED_REJECTION');
  });
}

/* ---------------------- Health Check Functions ---------------------- */
function startHealthChecks(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  healthCheckInterval = setInterval(async () => {
    try {
      const health = await mongooseFunctions.healthCheck();
      lastHealthCheck = new Date();

      if (!health.healthy) {
        logger.warn('Database health check failed:', health.error);

        // Attempt reconnection if connection is lost
        if (state === DatabaseConnectionState.CONNECTED) {
          logger.info('Attempting to reconnect to database...');
          await reconnect();
        }
      } else {
        logger.debug(`Database health check passed (${health.latency}ms)`);
      }
    } catch (error) {
      logger.error('Health check error:', error);
    }
  }, 30000); // Every 30 seconds
}

function stopHealthChecks(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

/* ---------------------- Main Connection Functions ---------------------- */
async function connect(): Promise<void> {
  if (state === DatabaseConnectionState.CONNECTED) {
    logger.info('Database already connected');
    return;
  }

  if (state === DatabaseConnectionState.CONNECTING) {
    logger.warn('Database connection already in progress');
    return;
  }

  state = DatabaseConnectionState.CONNECTING;
  connectionStartTime = new Date();

  try {
    logger.info('Initializing database connection...');

    await mongooseFunctions.connectWithRetry();

    state = DatabaseConnectionState.CONNECTED;
    lastHealthCheck = new Date();

    logger.info(
      `Database connected successfully in ${Date.now() - connectionStartTime.getTime()}ms`
    );

    // Start periodic health checks
    startHealthChecks();
  } catch (error) {
    state = DatabaseConnectionState.ERROR;
    logger.error('Failed to connect to database:', error);

    throw new mongooseFunctions.DatabaseConnectionError(
      'Database connection failed',
      error as Error
    );
  }
}

async function disconnect(): Promise<void> {
  if (state === DatabaseConnectionState.DISCONNECTED) {
    return;
  }

  state = DatabaseConnectionState.DISCONNECTING;

  // Stop health checks
  stopHealthChecks();

  try {
    await mongooseFunctions.disconnect();
    state = DatabaseConnectionState.DISCONNECTED;
    logger.info('Database disconnected successfully');
  } catch (error) {
    state = DatabaseConnectionState.ERROR;
    logger.error('Error disconnecting from database:', error);
    throw error;
  }
}

async function reconnect(): Promise<void> {
  logger.info('Attempting to reconnect to database...');

  try {
    await disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await connect();

    logger.info('Database reconnected successfully');
  } catch (error) {
    logger.error('Database reconnection failed:', error);
    throw error;
  }
}

/* ---------------------- Status and Utility Functions ---------------------- */
function getStatus() {
  const mongooseStatus = mongooseFunctions.getConnectionStatus();

  return {
    state,
    mongoose: mongooseStatus,
    connectionStartTime,
    lastHealthCheck,
    uptime: connectionStartTime ? Date.now() - connectionStartTime.getTime() : 0,
    config: {
      uri: getMaskedUri(config.uri),
      poolSize: config.options.maxPoolSize,
      environment: config.env,
    },
  };
}

async function getStatistics(): Promise<any> {
  try {
    const stats = await mongooseFunctions.getStats();
    return {
      ...stats,
      manager: {
        state,
        uptime: connectionStartTime ? Date.now() - connectionStartTime.getTime() : 0,
      },
    };
  } catch (error) {
    throw new mongooseFunctions.DatabaseQueryError(
      'Failed to get database statistics',
      error as Error
    );
  }
}

function isConnected(): boolean {
  return state === DatabaseConnectionState.CONNECTED;
}

async function withTransaction<T>(operation: (session: any) => Promise<T>): Promise<T> {
  const session = await mongooseFunctions.startSession();

  try {
    let result: T;

    await session.withTransaction(async () => {
      result = await operation(session);
    });

    return result!;
  } catch (error) {
    logger.error('Transaction failed:', error);
    throw new mongooseFunctions.DatabaseQueryError('Transaction failed', error as Error);
  } finally {
    await session.endSession();
  }
}

async function createSession(): Promise<any> {
  return await mongooseFunctions.startSession();
}

async function waitForConnection(timeout = 30000): Promise<void> {
  const start = Date.now();

  while (!isConnected()) {
    if (Date.now() - start > timeout) {
      throw new mongooseFunctions.DatabaseConnectionError(
        `Database connection timeout after ${timeout}ms`
      );
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Initialize graceful shutdown on import
setupGracefulShutdown();

// Export the databaseManager
export const databaseManager = {
  isConnected,
  getStatus,
  getStatistics,
  connect,
  disconnect,
  reconnect,

  ping: async (): Promise<number> => {
    const start = Date.now();
    const mongoose = mongooseFunctions.mongooseInstance;
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database not connected');
    }
    await db.admin().ping();
    return Date.now() - start;
  },

  getConnectionStats: () => {
    const mongoose = mongooseFunctions.mongooseInstance;
    const conn = mongoose.connection;
    return {
      readyState: conn.readyState,
      host: conn.host,
      name: conn.name,
      models: Object.keys(mongoose.models).length,
    };
  },
};

// Export individual functions
export {
  connect,
  createSession,  disconnect,
  getStatistics,
  getStatus,
  isConnected,
  reconnect,
  waitForConnection,
  withTransaction,
};

// Export from mongoose module
export { DatabaseConnectionError, DatabaseQueryError, mongooseInstance } from './mongoose';
