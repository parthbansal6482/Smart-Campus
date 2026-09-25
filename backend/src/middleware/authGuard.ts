import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

// Extend Express Request to hold user info
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token missing or invalid'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired authentication token'));
  }
};

/** Like `authenticate`, but lets the request through unauthenticated instead of rejecting it. */
export const authenticateOptional = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(authHeader.split(' ')[1]);
    } catch {
      // Ignore invalid tokens on optional-auth routes — treat as anonymous.
    }
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
