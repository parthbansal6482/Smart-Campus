import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { getAccountState } from '../utils/accountState';

// Extend Express Request to hold user info
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Resolves a bearer token to the current account: the token identifies the user, but their role
 * and active status come from the database, so promotions, demotions and deactivations take
 * effect immediately.
 */
const resolveUser = async (authHeader: string | undefined): Promise<TokenPayload | null> => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const payload = verifyAccessToken(authHeader.split(' ')[1]);
  const state = await getAccountState(payload.userId);
  if (!state?.isActive) return null;
  return { ...payload, role: state.role };
};

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.headers.authorization?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token missing or invalid'));
  }

  try {
    const user = await resolveUser(req.headers.authorization);
    if (!user) return next(new UnauthorizedError('This account no longer has access'));
    req.user = user;
    return next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired authentication token'));
  }
};

/** Like `authenticate`, but lets the request through unauthenticated instead of rejecting it. */
export const authenticateOptional = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const user = await resolveUser(req.headers.authorization);
    if (user) req.user = user;
  } catch {
    // Ignore invalid tokens on optional-auth routes — treat as anonymous.
  }
  return next();
};

export const requireRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Access denied. Allowed roles: ${allowedRoles.join(', ')}`)
      );
    }

    return next();
  };
};

/**
 * Guards a route that should only be reachable by the resource's owner, or
 * by one of the given elevated roles (typically ADMIN, or the relevant staff
 * role). `getOwnerId` reads the owning user id out of the resolved route —
 * for routes keyed by the resource's own id (e.g. `/users/:id`) this can
 * just read `req.params.id`.
 */
export const requireSelfOrRoles = (getOwnerId: (req: Request) => string, ...elevatedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const ownerId = getOwnerId(req);
    if (req.user.userId === ownerId || elevatedRoles.includes(req.user.role)) {
      return next();
    }

    return next(new ForbiddenError('You do not have access to this resource'));
  };
};
