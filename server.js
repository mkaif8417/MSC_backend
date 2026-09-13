const app = require('./src/app');
const env = require('./src/config/env');
const { connectDB, disconnectDB } = require('./src/config/db');

let server;

async function startServer() {
  try {
    // 1. Connect to MongoDB instance
    await connectDB();

    // 2. Start HTTP server
    server = app.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(` Masjid Study Center System Backend`);
      console.log(` Environment : ${env.NODE_ENV}`);
      console.log(` Port        : ${env.PORT}`);
      console.log(` API Endpoint: http://localhost:${env.PORT}/api/v1`);
      console.log(` Health Check: http://localhost:${env.PORT}/health`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Fatal startup error:', error.message);
    process.exit(1);
  }
}

/**
 * Handle Graceful Shutdown Signals (SIGINT, SIGTERM)
 */
async function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed');
      try {
        await disconnectDB();
        console.log('[Server] Graceful shutdown completed. Exiting process');
        process.exit(0);
      } catch (err) {
        console.error('[Server] Error during database disconnect:', err);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start application listener
startServer();
