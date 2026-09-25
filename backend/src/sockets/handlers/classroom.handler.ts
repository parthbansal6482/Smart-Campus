import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../socket.server';
import { logger } from '../../utils/logger';

/**
 * Room occupancy/facility state only ever changes through the REST
 * `PATCH /classrooms/rooms/:id/facilities` endpoint, which broadcasts
 * `classroom:occupancy_updated` itself once the database write succeeds.
 * Clients here are read-only subscribers — there is no event a socket can
 * emit to change state, which closes off the previous spoofing hole.
 */
export const registerClassroomHandlers = (io: Server, socket: AuthenticatedSocket) => {
  socket.on('classroom:join_room', (roomId: string) => {
    if (typeof roomId !== 'string' || !roomId) return;
    socket.join(`room-${roomId}`);
    logger.debug(`Socket ${socket.id} joined room-${roomId}`);
  });

  socket.on('classroom:leave_room', (roomId: string) => {
    if (typeof roomId !== 'string' || !roomId) return;
    socket.leave(`room-${roomId}`);
    logger.debug(`Socket ${socket.id} left room-${roomId}`);
  });
};
