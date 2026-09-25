import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from '../config/db';
import { NotificationType } from '@prisma/client';
import { logger } from '../utils/logger';
import { getSocketIO } from '../sockets/socket.server';

const expo = new Expo();

export interface SendNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Persists a notification, pushes it live over the user's socket room, and
 * best-effort delivers it via Expo push if the user has registered a device
 * token. Never throws — a delivery failure must never fail the request that
 * triggered it (an emergency being reported, an order status changing, ...).
 */
export const notifyUser = async (input: SendNotificationInput): Promise<void> => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data as any,
      },
    });

    try {
      getSocketIO().to(`user-${input.userId}`).emit('notification:new', notification);
    } catch {
      // Socket server not initialized (e.g. in tests) — persisted notification is enough.
    }

    await sendExpoPush(input.userId, input.title, input.body, input.data);
  } catch (error) {
    logger.error('Failed to create notification', { input, error });
  }
};

const sendExpoPush = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { expoPushToken: true } });
  const token = user?.expoPushToken;
  if (!token || !Expo.isExpoPushToken(token)) return;

  const message: ExpoPushMessage = { to: token, sound: 'default', title, body, data };

  try {
    await expo.sendPushNotificationsAsync([message]);
  } catch (error) {
    logger.error('Expo push delivery failed', { userId, error });
  }
};

/** Fan-out helper for notifying every user with one of the given roles (e.g. all responders). */
export const notifyRoles = async (
  roles: string[],
  payload: Omit<SendNotificationInput, 'userId'>
): Promise<void> => {
  const users = await prisma.user.findMany({ where: { role: { in: roles as any }, isActive: true }, select: { id: true } });
  await Promise.all(users.map(u => notifyUser({ ...payload, userId: u.id })));
};
