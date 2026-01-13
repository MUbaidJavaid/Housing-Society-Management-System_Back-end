// src/server.ts
// import { startServer } from './app';
// import { logger } from './logger';

// // Start the server
// startServer()
//   .then(_server => {
//     logger.info('Server started successfully');
//   })
//   .catch(error => {
//     logger.error('Failed to start server:', error);
//     process.exit(1);
//   });
// src/server.ts
// src/server.ts
import { startServer } from './app';
import { logger } from './logger';

// Add error handling for uncaught exceptions
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Rejection:', reason);
});

// Start the server
startServer()
  .then(app => {
    const server = (app as any).server;
    if (server) {
      const address = server.address();
      if (typeof address === 'object' && address !== null) {
        logger.info(`Server started on port ${address.port}`);
        console.log(`✅ Server confirmed listening on port ${address.port}`);
      }
    }
  })
  .catch(error => {
    console.error('❌ Failed to start server in server.ts:', error);
    logger.error('Failed to start server:', error);
    // Don't exit immediately, give time for logs to flush
    setTimeout(() => process.exit(1), 1000);
  });
