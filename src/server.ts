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

// Add this immediately
console.log('🚀 [server.ts] Starting application...');
console.log('🔍 [server.ts] Checking environment variables...');

// Manually check critical variables
const criticalVars = ['MONGODB_URI', 'MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
criticalVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? '✓ SET' : '✗ NOT SET'}`);

  // Special case for MONGO_URI
  if (varName === 'MONGO_URI' && value) {
    console.log(`MONGO_URI value: ${value.substring(0, 30)}...`);
  }
});

console.log('PORT:', process.env.PORT || '10000 (default)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

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
    process.exit(1);
  });
