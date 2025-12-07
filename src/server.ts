// src/server.ts
import { startServer } from './app';
import { logger } from './logger';

// Start the server
startServer()
  .then(_server => {
    logger.info('Server started successfully');
  })
  .catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
