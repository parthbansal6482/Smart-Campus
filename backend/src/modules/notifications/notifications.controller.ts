import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { sendSuccess } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import { getPagination, buildMeta } from '../../utils/pagination';

export class NotificationsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { skip, take, page, limit } = getPagination(req);
      const unreadOnly = req.query.unread === 'true';

      const where = { userId, read: unreadOnly ? false : undefined };
      const [notifications, total, unreadCount] = await prisma.$transaction([
        prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, read: false } }),
      ]);

      return sendSuccess(res, notifications, 'Notifications retrieved', 200, { ...buildMeta(page, limit, total), unreadCount });
    } catch (error) {
      return next(error);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
      if (!notification || notification.userId !== req.user!.userId) {
        throw new NotFoundError('Notification not found');
      }

      const updated = await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
      return sendSuccess(res, updated, 'Notification marked as read');
    } catch (error) {
      return next(error);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.notification.updateMany({ where: { userId: req.user!.userId, read: false }, data: { read: true } });
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) {
      return next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
