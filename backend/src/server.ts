import http from 'http';
import { createApp } from './app';
import { initSocketServer } from './sockets/socket.server';
import { config } from './config';
import { prisma } from './config/db';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    // Fail fast and loudly if the database isn't reachable, instead of
    // starting up and failing on the first request with a confusing error.
    await prisma.$connect();
    logger.info('🗄️  Database connection established');

    const app = createApp();
    const httpServer = http.createServer(app);

    initSocketServer(httpServer);

    httpServer.listen(config.port, () => {
      logger.info(`🚀 Smart Campus Backend server running on port ${config.port} (${config.env})`);
      logger.info(`🌐 REST API base URL: http://localhost:${config.port}/api/v1`);
      logger.info(`🔌 WebSocket server attached and listening on ws://localhost:${config.port}`);
      logger.info(`📖 API docs: http://localhost:${config.port}/docs`);
    });

    let shuttingDown = false;
    const shutdown = async (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;
      logger.info(`${signal} received — shutting down gracefully`);

      const forceExitTimer = setTimeout(() => {
        logger.error('Graceful shutdown timed out, forcing exit');
        process.exit(1);
      }, 10_000);
      forceExitTimer.unref();

      httpServer.close(async () => {
        await prisma.$disconnect();
        clearTimeout(forceExitTimer);
        logger.info('Shutdown complete');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception — exiting:', error);
  // An uncaught exception has left the process in an unknown state; exiting
  // and letting the process manager restart it is safer than limping on.
  process.exit(1);
});

startServer();
