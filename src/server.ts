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
import { startServer } from './app';
import { logger } from './logger';

// CRITICAL: Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  logger.error('Unhandled Rejection:', { reason, promise });
  // DO NOT EXIT
});

process.on('uncaughtException', error => {
  console.error('UNCAUGHT EXCEPTION:', error);
  logger.error('Uncaught Exception:', error);
  // DO NOT EXIT
});

console.log('🚀 [server.ts] Starting application...');
console.log('🔍 [server.ts] Checking environment...');
console.log('PORT:', process.env.PORT || '10000 (default)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

// Wrap everything in try-catch
(async () => {
  try {
    console.log('🟡 Starting server...');
    const app = await startServer();
    console.log('✅ Server started successfully');

    const server = (app as any).server;
    if (server) {
      const address = server.address();
      if (address && typeof address === 'object') {
        console.log(`🌐 Server listening on port ${address.port}`);
      }
    }
  } catch (error) {
    console.error('❌ FATAL: Failed to start server:', error);
    // Wait 5 seconds before exiting to see logs
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }
})();
