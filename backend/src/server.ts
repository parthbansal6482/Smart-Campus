import http from 'http';
import { createApp } from './app';
import { initSocketServer } from './sockets/socket.server';
import { config } from './config';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    const app = createApp();
    const httpServer = http.createServer(app);

    // Initialize Socket.io
    initSocketServer(httpServer);

    httpServer.listen(config.port, () => {
      logger.info(`🚀 Smart Campus Backend server running on port ${config.port} (${config.env})`);
      logger.info(`🌐 REST API base URL: http://localhost:${config.port}/api/v1`);
      logger.info(`🔌 WebSocket server attached and listening on ws://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
