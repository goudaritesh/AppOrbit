import 'dotenv/config';
import { validateEnv } from './src/config/envValidator.js';

// Validate critical environment invariants at boot
validateEnv();

// Handle uncaught exceptions before loading other modules
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Shutting down server...');
  console.error(err.stack || err);
  process.exit(1);
});

import http from 'http';
import app from './app.js';
import { connectDB } from './src/config/db.js';
import { initializeSocket } from './src/realtime/socket.js';

const PORT = parseInt(process.env.PORT, 10) || 5000;

/**
 * Boots the database connection and launches HTTP server with real-time Socket.IO.
 */
const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const httpServer = http.createServer(app);
  initializeSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` AppOrbit Server running in [${process.env.NODE_ENV || 'development'}] mode`);
    console.log(` Port: http://localhost:${PORT}`);
    console.log(` Health: http://localhost:${PORT}/api/health`);
    console.log(` Real-time WebSockets: Active (Socket.IO)`);
    console.log(`=========================================`);
  });

  const server = httpServer;

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err) => {
    console.error('[UNHANDLED REJECTION] Shutting down gracefully...');
    console.error(err.stack || err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful termination handler
  const handleShutdown = (signal) => {
    console.log(`[SHUTDOWN] Received ${signal}. Closing HTTP server...`);
    server.close(() => {
      console.log('[SHUTDOWN] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer();
