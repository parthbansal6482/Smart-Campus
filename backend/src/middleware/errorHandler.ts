import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  logger.error(`[Error Handler] ${req.method} ${req.originalUrl}:`, err.message);

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Handle Prisma / standard errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return sendError(res, 'Database request error', 400, err);
  }

  return sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500,
    process.env.NODE_ENV === 'production' ? undefined : err.stack
  );
};
