import { Server } from 'socket.io';
import { Role } from '@prisma/client';
import { AuthenticatedSocket } from '../socket.server';
import { prisma } from '../../config/db';
import { logger } from '../../utils/logger';

export const registerCafeteriaHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const { userId, role } = socket.data.user;

  // Track one specific order — only its owner or cafeteria staff/admin may
  // join, so students can't watch each other's orders.
  socket.on('cafeteria:track_order', async (orderId: string) => {
    if (typeof orderId !== 'string' || !orderId) return;

    if (role === Role.CAFETERIA_STAFF || role === Role.ADMIN) {
      socket.join(`order-${orderId}`);
      return;
    }

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true } });
    if (order?.userId === userId) {
      socket.join(`order-${orderId}`);
    } else {
      logger.debug(`Rejected cafeteria:track_order for ${orderId} from non-owner ${userId}`);
    }
  });
};
