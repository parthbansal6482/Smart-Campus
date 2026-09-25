import { prisma } from '../config/db';
import { logger } from './logger';

interface AuditEntry {
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Best-effort audit trail for actions that change safety- or access-critical
 * state (role changes, emergency status, booking cancellations, ...).
 * Never throws — a logging failure must not block the action it's recording.
 */
export const recordAudit = async (entry: AuditEntry): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        metadata: entry.metadata as any,
      },
    });
  } catch (error) {
    logger.error('Failed to write audit log entry', { entry, error });
  }
};
