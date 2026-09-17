import { Server, Socket } from 'socket.io';
import { logger } from '../../utils/logger';

export const registerCafeteriaHandlers = (io: Server, socket: Socket) => {
  // Staff joins kitchen channel
  socket.on('cafeteria:join_staff', () => {
    socket.join('cafeteria-staff');
    logger.info(`Socket ${socket.id} joined cafeteria-staff room`);
  });

  // User tracks their order
  socket.on('cafeteria:track_order', (orderId: string) => {
    socket.join(`order-${orderId}`);
    logger.debug(`Socket ${socket.id} tracking order-${orderId}`);
  });

  // User joins their personal order updates
  socket.on('cafeteria:join_user_orders', (userId: string) => {
    socket.join(`user-${userId}`);
    logger.debug(`Socket ${socket.id} joined user-${userId} orders`);
  });
};
