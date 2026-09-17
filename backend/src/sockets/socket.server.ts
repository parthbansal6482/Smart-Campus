import { Server as HttpServer } from 'http';
import { Server, ServerOptions } from 'socket.io';
import { logger } from '../utils/logger';
import { registerClassroomHandlers } from './handlers/classroom.handler';
import { registerEmergencyHandlers } from './handlers/emergency.handler';
import { registerCafeteriaHandlers } from './handlers/cafeteria.handler';

let ioInstance: Server | null = null;

export const initSocketServer = (httpServer: HttpServer, options?: Partial<ServerOptions>): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Adjust or restrict in production
      methods: ['GET', 'POST'],
    },
    ...options,
  });

  io.on('connection', socket => {
    logger.info(`🔌 New WebSocket client connected: ${socket.id}`);

    // Register modular feature handlers
    registerClassroomHandlers(io, socket);
    registerEmergencyHandlers(io, socket);
    registerCafeteriaHandlers(io, socket);

    socket.on('disconnect', reason => {
      logger.info(`❌ WebSocket client disconnected: ${socket.id} (${reason})`);
    });
  });

  ioInstance = io;
  return io;
};

export const getSocketIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized yet');
  }
  return ioInstance;
};
