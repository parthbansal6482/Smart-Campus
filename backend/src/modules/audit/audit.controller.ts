import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { sendSuccess } from '../../utils/response';
import { getPagination, buildMeta } from '../../utils/pagination';
import { Prisma } from '@prisma/client';

export class AuditController {
  /** Admin-only read access to the audit trail — every write is recorded by
   *  utils/audit.ts, but nothing previously let anyone actually see it. */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { skip, take, page, limit } = getPagination(req);
      const { action, targetType, actorId, from, to } = req.query;

      const where: Prisma.AuditLogWhereInput = {
        action: typeof action === 'string' ? { contains: action, mode: 'insensitive' } : undefined,
        targetType: typeof targetType === 'string' ? targetType : undefined,
        actorId: typeof actorId === 'string' ? actorId : undefined,
        createdAt:
          from || to
            ? {
                gte: typeof from === 'string' ? new Date(from) : undefined,
                lte: typeof to === 'string' ? new Date(to) : undefined,
              }
            : undefined,
      };

      const [entries, total] = await prisma.$transaction([
        prisma.auditLog.findMany({
          where,
          include: { actor: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return sendSuccess(res, entries, 'Audit log retrieved', 200, buildMeta(page, limit, total));
    } catch (error) {
      return next(error);
    }
  }
}

export const auditController = new AuditController();
