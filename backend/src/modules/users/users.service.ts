import bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../config/db';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { getPagination, buildMeta } from '../../utils/pagination';
import { recordAudit } from '../../utils/audit';

const SALT_ROUNDS = 12;

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  isActive: true,
  createdAt: true,
} as const;

export class UsersService {
  async getAllUsers(params: { role?: Role; search?: string; skip: number; take: number }) {
    const where: Prisma.UserWhereInput = {
      role: params.role,
      OR: params.search
        ? [
            { name: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: publicUserSelect,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...publicUserSelect,
        bookings: { take: 5, orderBy: { createdAt: 'desc' } },
        orders: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /** Admin-only account creation — the sole path by which a non-STUDENT role can be assigned. */
  async createUser(data: { name: string; email: string; password: string; role: Role; phone?: string }, actorId: string) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        phone: data.phone,
      },
      select: publicUserSelect,
    });

    await recordAudit({ actorId, action: 'user.create', targetType: 'User', targetId: user.id, metadata: { role: data.role } });
    return user;
  }

  async updateUserRole(id: string, role: Role, actorId: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (id === actorId) {
      throw new ConflictError('You cannot change your own role');
    }

    if (user.role === Role.ADMIN && role !== Role.ADMIN) {
      const otherAdmins = await prisma.user.count({ where: { role: Role.ADMIN, id: { not: id }, isActive: true } });
      if (otherAdmins === 0) {
        throw new ConflictError('Cannot remove the last remaining administrator');
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: publicUserSelect,
    });

    await recordAudit({
      actorId,
      action: 'user.role_change',
      targetType: 'User',
      targetId: id,
      metadata: { from: user.role, to: role },
    });

    return updated;
  }

  async updateActiveStatus(id: string, isActive: boolean, actorId: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (id === actorId && !isActive) {
      throw new ConflictError('You cannot deactivate your own account');
    }
    if (user.role === Role.ADMIN && !isActive) {
      const otherActiveAdmins = await prisma.user.count({ where: { role: Role.ADMIN, id: { not: id }, isActive: true } });
      if (otherActiveAdmins === 0) {
        throw new ConflictError('Cannot deactivate the last remaining administrator');
      }
    }

    const updated = await prisma.user.update({ where: { id }, data: { isActive }, select: publicUserSelect });
    await recordAudit({ actorId, action: isActive ? 'user.activate' : 'user.deactivate', targetType: 'User', targetId: id });
    return updated;
  }

  async updateProfile(id: string, data: { name?: string; phone?: string }) {
    return prisma.user.update({ where: { id }, data, select: publicUserSelect });
  }

  async updatePushToken(id: string, expoPushToken: string | null) {
    await prisma.user.update({ where: { id }, data: { expoPushToken } });
  }
}

export const usersService = new UsersService();
