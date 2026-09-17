import { Server, Socket } from 'socket.io';
import { logger } from '../../utils/logger';

export const registerClassroomHandlers = (io: Server, socket: Socket) => {
  // Join room updates room
  socket.on('classroom:join_room', (roomId: string) => {
    socket.join(`room-${roomId}`);
    logger.debug(`Socket ${socket.id} joined room-${roomId}`);
  });

  socket.on('classroom:leave_room', (roomId: string) => {
    socket.leave(`room-${roomId}`);
    logger.debug(`Socket ${socket.id} left room-${roomId}`);
  });

  // Client requests occupancy update broadcast
  socket.on('classroom:occupancy_changed', (data: { roomId: string; isOccupied: boolean }) => {
    io.to(`room-${data.roomId}`).emit('classroom:occupancy_updated', data);
    io.emit('classroom:list_updated', data);
  });
};
