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
import { startServer } from './app';
import { logger } from './logger';

// Start the server
startServer()
  .then(app => {
    // Get the server instance from the app
    const server = (app as any).server;

    if (server) {
      const address = server.address();
      if (typeof address === 'object' && address !== null) {
        logger.info(`Server started on port ${address.port}`);
      }
    }
  })
  .catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
