import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../../config/db';
import { config } from '../../config';
import { RegisterInput, LoginInput } from './auth.schema';
import { ConflictError, ForbiddenError, LockedError, UnauthorizedError } from '../../utils/errors';
import { generateAccessToken } from '../../utils/jwt';
import { generateOpaqueToken, hashToken } from '../../utils/secureTokens';
import { sendEmail } from '../../services/email.service';
import { recordAudit } from '../../utils/audit';

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  isActive: true,
  createdAt: true,
} as const;

const parseRefreshTtlMs = (): number => {
  // config.jwt.refreshExpiresIn is a human string like "30d"; for the DB
  // record we just need a millisecond duration, so this only needs to
  // handle the small set of unit suffixes we actually configure.
  const match = /^(\d+)\s*(d|h|m)?$/.exec(config.jwt.refreshExpiresIn.trim());
  if (!match) return REFRESH_TOKEN_TTL_MS;
  const value = parseInt(match[1], 10);
  const unit = match[2] || 'd';
  const unitMs = unit === 'h' ? 3600_000 : unit === 'm' ? 60_000 : 86_400_000;
  return value * unitMs;
};

export class AuthService {
  private async issueTokenPair(user: { id: string; email: string; role: Role }) {
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });

    const refreshToken = generateOpaqueToken();
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + parseRefreshTtlMs()),
      },
    });

    return { accessToken, refreshToken };
  }

  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Public signup can only ever create a STUDENT — see auth.schema.ts.
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: Role.STUDENT,
        phone: input.phone,
      },
      select: publicUserSelect,
    });

    const tokens = await this.issueTokenPair(user);
    await recordAudit({ actorId: user.id, action: 'auth.register', targetType: 'User', targetId: user.id });

    return { user, ...tokens };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    // Same generic message whether the email doesn't exist or the password
    // is wrong — don't let login responses be used to enumerate accounts.
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenError('This account has been deactivated. Contact an administrator.');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new LockedError(`Too many failed attempts. Try again in ${minutesLeft} minute(s).`);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);

    if (!isMatch) {
      const failedLoginAttempts = user.failedLoginAttempts + 1;
      const lockedUntil = failedLoginAttempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_DURATION_MS) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts, lockedUntil },
      });

      if (lockedUntil) {
        throw new LockedError('Too many failed attempts. This account is locked for 15 minutes.');
      }
      throw new UnauthorizedError('Invalid email or password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokenPair(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  /** Refresh-token rotation: the presented token is revoked and a new pair issued, so a stolen
   *  token can only ever be used once before the legitimate owner's next refresh invalidates it. */
  async refresh(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const record = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token is invalid or has expired');
    }

    if (!record.user.isActive) {
      throw new ForbiddenError('This account has been deactivated. Contact an administrator.');
    }

    await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });

    return this.issueTokenPair(record.user);
  }

  async logout(rawToken?: string) {
    if (!rawToken) return;
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always behave the same way whether or not the email is registered —
    // otherwise this endpoint becomes an account-enumeration oracle.
    if (user && user.isActive) {
      const rawToken = generateOpaqueToken();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(rawToken),
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const resetLink = `${config.clientUrl}/reset-password?token=${rawToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Reset your Smart Campus password',
        text: `We received a request to reset your password. This link expires in 1 hour:\n\n${resetLink}\n\nIf you didn't request this, you can ignore this email.`,
      });
    }

    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = hashToken(rawToken);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedError('This reset link is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Resetting a password should force every existing session to re-authenticate.
      prisma.refreshToken.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);

    await recordAudit({ actorId: record.userId, action: 'auth.password_reset', targetType: 'User', targetId: record.userId });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });

    if (!user) {
      throw new UnauthorizedError('User session invalid');
    }

    return user;
  }
}

export const authService = new AuthService();
