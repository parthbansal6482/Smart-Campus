import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { config } from '../config';

const formatZodIssues = (error: ZodError) =>
  error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }));

const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError, res: Response) => {
  switch (err.code) {
    case 'P2002': {
      const fields = (err.meta?.target as string[] | undefined)?.join(', ') || 'field';
      return sendError(res, `A record with this ${fields} already exists`, 409);
    }
    case 'P2003':
      return sendError(res, 'This action refers to a record that does not exist', 400);
    case 'P2025':
      return sendError(res, 'The requested record was not found', 404);
    default:
      return sendError(res, 'Database request error', 400, config.isProduction ? undefined : err.message);
  }
};

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

  if (err instanceof ZodError) {
    return sendError(res, 'Validation failed', 400, formatZodIssues(err));
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return sendError(res, 'Invalid data sent to the database', 400);
  }

  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
    return sendError(res, message, 400);
  }

  // A Postgres EXCLUDE constraint (used to stop overlapping room bookings)
  // surfaces as an unmapped raw error rather than a known Prisma code.
  if (/exclusion constraint/i.test(err.message)) {
    return sendError(res, 'This conflicts with an existing booking for the same room and time', 409);
  }

  return sendError(
    res,
    config.isProduction ? 'Internal server error' : err.message,
    500,
    config.isProduction ? undefined : err.stack
  );
};
