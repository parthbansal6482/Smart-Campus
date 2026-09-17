import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/users.routes';
import { classroomRoutes } from './modules/classrooms/classrooms.routes';
import { emergencyRoutes } from './modules/emergency/emergency.routes';
import { cafeteriaRoutes } from './modules/cafeteria/cafeteria.routes';
import { sendSuccess } from './utils/response';
import { NotFoundError } from './utils/errors';

export const createApp = (): Application => {
  const app = express();

  // Security & standard middleware
  app.use(helmet());
  app.use(
    cors({
      origin: '*', // Allow web and mobile clients
      credentials: true,
    })
  );
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Apply rate limiting to all api routes
  app.use('/api', apiLimiter);

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    return sendSuccess(res, {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }, 'Smart Campus API is healthy');
  });

  // Feature routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/classrooms', classroomRoutes);
  app.use('/api/v1/emergency', emergencyRoutes);
  app.use('/api/v1/cafeteria', cafeteriaRoutes);

  // 404 handler for unknown routes
  app.use('*', (req: Request, res: Response, next) => {
    next(new NotFoundError(`Endpoint ${req.originalUrl} not found`));
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};
