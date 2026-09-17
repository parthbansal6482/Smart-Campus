import { Server, Socket } from 'socket.io';
import { logger } from '../../utils/logger';

export const registerEmergencyHandlers = (io: Server, socket: Socket) => {
  // Medical responders & Admins join responders channel
  socket.on('emergency:join_responders', () => {
    socket.join('emergency-responders');
    logger.info(`Socket ${socket.id} joined emergency-responders room`);
  });

  // Track specific emergency incident
  socket.on('emergency:join_incident', (emergencyId: string) => {
    socket.join(`emergency-${emergencyId}`);
    logger.debug(`Socket ${socket.id} joined emergency-${emergencyId}`);
  });

  // User tracks their personal alerts
  socket.on('emergency:join_user', (userId: string) => {
    socket.join(`emergency-user-${userId}`);
    logger.debug(`Socket ${socket.id} joined emergency-user-${userId}`);
  });

  // Responder location streaming
  socket.on(
    'emergency:responder_location',
    (data: { emergencyId: string; latitude: number; longitude: number; responderName: string }) => {
      io.to(`emergency-${data.emergencyId}`).emit('emergency:responder_location_updated', data);
    }
  );
};
