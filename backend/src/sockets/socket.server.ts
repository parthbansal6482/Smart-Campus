import { Server as HttpServer } from 'http';
import { Server, ServerOptions, Socket } from 'socket.io';
import { Role } from '@prisma/client';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { config } from '../config';
import { logger } from '../utils/logger';
import { registerClassroomHandlers } from './handlers/classroom.handler';
import { registerEmergencyHandlers } from './handlers/emergency.handler';
import { registerCafeteriaHandlers } from './handlers/cafeteria.handler';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: TokenPayload;
  };
}

const RESPONDER_ROLES: Role[] = [Role.MEDICAL_STAFF, Role.AMBULANCE_RESPONDER, Role.ADMIN];
const CAFETERIA_STAFF_ROLES: Role[] = [Role.CAFETERIA_STAFF, Role.ADMIN];

let ioInstance: Server | null = null;

export const initSocketServer = (httpServer: HttpServer, options?: Partial<ServerOptions>): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.isProduction ? config.cors.allowedOrigins : true,
      credentials: true,
    },
    ...options,
  });

  // Every socket connection must present a valid access token. Room
  // membership is then derived from the token's role server-side — a client
  // can never join `emergency-responders` or `cafeteria-staff` just by
  // emitting the right event name, the way the previous implementation
  // allowed.
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.headers.authorization?.toString().startsWith('Bearer ')
        ? socket.handshake.headers.authorization!.toString().split(' ')[1]
        : undefined);

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as AuthenticatedSocket).data.user = payload;
      return next();
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', socket => {
    const authSocket = socket as AuthenticatedSocket;
    const { userId, role } = authSocket.data.user;

    logger.info(`🔌 WebSocket client connected: ${socket.id} (user ${userId}, role ${role})`);

    // Every authenticated user automatically gets their own private channel
    // for notifications/status updates — no client-declared join needed,
    // and no way to join someone else's.
    socket.join(`user-${userId}`);

    if (RESPONDER_ROLES.includes(role)) {
      socket.join('emergency-responders');
    }
    if (CAFETERIA_STAFF_ROLES.includes(role)) {
      socket.join('cafeteria-staff');
    }

    registerClassroomHandlers(io, authSocket);
    registerEmergencyHandlers(io, authSocket);
    registerCafeteriaHandlers(io, authSocket);

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
