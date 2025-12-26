import logger from '../core/logger';
import { connectDB, disconnectDB } from './connection';

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await connectDB();
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  try {
    await disconnectDB();
  } catch (error) {
    logger.error('Failed to close database:', error);
    throw error;
  }
}

/**
 * Setup graceful shutdown handlers
 */
export function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, closing database connection...`);
    try {
      await closeDatabase();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default { initializeDatabase, closeDatabase, setupGracefulShutdown };
