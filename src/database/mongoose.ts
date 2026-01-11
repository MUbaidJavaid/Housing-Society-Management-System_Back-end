import mongoose from 'mongoose';
import logger from '../core/logger';

export class AtlasConnectionError extends Error {
  constructor(
    message: string,
    public originalError?: any,
    public details?: any
  ) {
    super(message);
    this.name = 'AtlasConnectionError';
  }
}

export class AtlasConnectionManager {
  private static instance: AtlasConnectionManager;
  private connectionAttempts = 0;
  private isInitialized = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): AtlasConnectionManager {
    if (!AtlasConnectionManager.instance) {
      AtlasConnectionManager.instance = new AtlasConnectionManager();
    }
    return AtlasConnectionManager.instance;
  }

  /**
   * Initialize MongoDB Atlas connection with comprehensive error handling
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && mongoose.connection.readyState === 1) {
      logger.info('MongoDB Atlas already connected');
      return;
    }

    this.connectionAttempts = 0;

    // Configure mongoose for Atlas
    mongoose.set('strictQuery', true);

    // Setup event listeners
    this.setupEventListeners();
    // Get URI from environment
    const mongoUri = process.env.MONGO_URI;
    try {
      logger.info('Connecting to MongoDB Atlas...');

      if (!mongoUri) {
        throw new Error('MONGO_URI environment variable is not set');
      }

      await mongoose.connect(mongoUri);

      this.isInitialized = true;
      this.startHealthCheck();

      logger.info('✅ MongoDB Atlas connected successfully');
    } catch (error: any) {
      logger.error('❌ MongoDB Atlas connection failed:', {
        error: error.message,
        code: error.code,
        name: error.name,
        connectionAttempts: this.connectionAttempts,
      });

      // Provide helpful error messages based on common Atlas issues
      let helpfulMessage = 'Unknown connection error';

      if (error.code === 'ENOTFOUND') {
        helpfulMessage =
          'DNS resolution failed. Check your network connection and Atlas cluster URL.';
      } else if (error.code === 'ETIMEDOUT') {
        helpfulMessage =
          'Connection timeout. Check IP whitelisting in Atlas and increase timeout settings.';
      } else if (
        error.code === 'MONGODB_ERROR' &&
        error.message.includes('Authentication failed')
      ) {
        helpfulMessage =
          'Authentication failed. Check username/password and ensure user has correct permissions.';
      } else if (error.message.includes('self signed certificate')) {
        helpfulMessage =
          'SSL certificate issue. Ensure MONGODB_TLS_ALLOW_INVALID_CERTIFICATES is false for production.';
      }

      throw new AtlasConnectionError(`MongoDB Atlas connection failed: ${helpfulMessage}`, error, {
        uri: mongoUri ? mongoUri.substring(0, 50) + '...' : 'Not set',
        attempts: this.connectionAttempts,
        time: new Date().toISOString(),
      });
    }
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB Atlas connected');
      this.connectionAttempts = 0;
    });

    mongoose.connection.on('error', error => {
      logger.error('MongoDB Atlas connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB Atlas disconnected');
      this.stopHealthCheck();
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB Atlas reconnected');
      this.startHealthCheck();
    });

    mongoose.connection.on('reconnectFailed', () => {
      logger.error('MongoDB Atlas reconnect failed');
    });
  }

  private startHealthCheck(): void {
    this.stopHealthCheck();

    this.healthCheckInterval = setInterval(async () => {
      try {
        const start = Date.now();
        await mongoose.connection.db?.admin().ping();
        const latency = Date.now() - start;

        if (latency > 1000) {
          logger.warn(`MongoDB Atlas health check slow: ${latency}ms`);
        }
      } catch (error) {
        logger.error('MongoDB Atlas health check failed:', error);
      }
    }, 30000); // Every 30 seconds
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  async disconnect(): Promise<void> {
    this.stopHealthCheck();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      this.isInitialized = false;
      logger.info('MongoDB Atlas disconnected');
    }
  }

  getStatus(): any {
    return {
      readyState: mongoose.connection.readyState,
      state: this.getReadyStateName(mongoose.connection.readyState),
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      models: Object.keys(mongoose.models || {}).length,
      connectionAttempts: this.connectionAttempts,
      isInitialized: this.isInitialized,
    };
  }

  private getReadyStateName(state: number): string {
    switch (state) {
      case 0:
        return 'disconnected';
      case 1:
        return 'connected';
      case 2:
        return 'connecting';
      case 3:
        return 'disconnecting';
      default:
        return 'unknown';
    }
  }

  async testConnection(): Promise<{
    success: boolean;
    latency: number;
    error?: string;
    details?: any;
  }> {
    const start = Date.now();

    try {
      if (!mongoose.connection.db) {
        throw new Error('Not connected to database');
      }

      await mongoose.connection.db.admin().ping();
      const latency = Date.now() - start;

      return {
        success: true,
        latency,
        details: {
          host: mongoose.connection.host,
          database: mongoose.connection.name,
          readyState: this.getReadyStateName(mongoose.connection.readyState),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        latency: Date.now() - start,
        error: error.message,
        details: {
          readyState: this.getReadyStateName(mongoose.connection.readyState),
        },
      };
    }
  }
}

// Singleton instance
export const atlasConnection = AtlasConnectionManager.getInstance();
export default atlasConnection;
