import { Server } from 'socket.io';
import { Role } from '@prisma/client';
import { AuthenticatedSocket } from '../socket.server';
import { prisma } from '../../config/db';
import { logger } from '../../utils/logger';

const RESPONDER_ROLES: Role[] = [Role.MEDICAL_STAFF, Role.AMBULANCE_RESPONDER, Role.ADMIN];

export const registerEmergencyHandlers = (io: Server, socket: AuthenticatedSocket) => {
  const { userId, role } = socket.data.user;

  // Track one specific incident — only its reporter or a responder/staff
  // account may join, so a student can't watch someone else's emergency.
  socket.on('emergency:join_incident', async (emergencyId: string) => {
    if (typeof emergencyId !== 'string' || !emergencyId) return;

    if (RESPONDER_ROLES.includes(role)) {
      socket.join(`emergency-${emergencyId}`);
      return;
    }

    const emergency = await prisma.emergency.findUnique({ where: { id: emergencyId }, select: { userId: true } });
    if (emergency?.userId === userId) {
      socket.join(`emergency-${emergencyId}`);
    }
  });

  // Only an actual responder may stream a live location, and only into an
  // incident room (which itself requires being a responder to join, or the
  // incident owner to receive).
  socket.on(
    'emergency:responder_location',
    (data: { emergencyId: string; latitude: number; longitude: number; responderName: string }) => {
      if (!RESPONDER_ROLES.includes(role)) {
        logger.warn(`Rejected emergency:responder_location from non-responder ${userId}`);
        return;
      }
      if (!data?.emergencyId || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return;

      io.to(`emergency-${data.emergencyId}`).emit('emergency:responder_location_updated', data);
    }
  );
};
