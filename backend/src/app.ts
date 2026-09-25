import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import crypto from 'crypto';
import swaggerUi from 'swagger-ui-express';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/users.routes';
import { classroomRoutes } from './modules/classrooms/classrooms.routes';
import { medicalRoutes } from './modules/medical-help/medical.routes';
import { cafeteriaRoutes } from './modules/cafeteria/cafeteria.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';
import { uploadRoutes } from './modules/uploads/uploads.routes';
import { sendSuccess } from './utils/response';
import { NotFoundError } from './utils/errors';
import { config } from './config';
import { prisma } from './config/db';
import { loadOpenApiDocument } from './docs/openapi';

export const createApp = (): Application => {
  const app = express();

  app.set('trust proxy', 1);

  // Security & standard middleware
  app.use(
    helmet({
      contentSecurityPolicy: config.isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        // No Origin header (server-to-server, curl, native app) — allow.
        if (!origin) return callback(null, true);

        const { allowedOrigins } = config.cors;
        // Development convenience: no allowlist configured means allow any
        // origin so Expo's constantly-changing local ports keep working.
        if (!config.isProduction && allowedOrigins.length === 0) return callback(null, true);

        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} is not allowed`));
      },
      credentials: true,
    })
  );

  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Correlates one request's log lines together; echoed back so a client
  // can quote it when reporting an issue.
  app.use((req, res, next) => {
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    res.setHeader('x-request-id', requestId);
    (req as any).requestId = requestId;
    next();
  });

  // Prescription photos, menu images, etc. Served from local disk today;
  // swapping to S3/Supabase Storage later only means changing upload.ts.
  app.use('/uploads', express.static(path.resolve(process.cwd(), config.upload.dir)));

  // Apply rate limiting to all API routes (GET requests are exempt so
  // polling dashboards don't starve out real usage — see rateLimiter.ts)
  app.use('/api', apiLimiter);

  // Health check — verifies the database is actually reachable rather than
  // just "the Node process is alive".
  app.get('/health', async (req: Request, res: Response) => {
    let dbHealthy = true;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbHealthy = false;
    }

    return sendSuccess(
      res,
      {
        status: dbHealthy ? 'ok' : 'degraded',
        database: dbHealthy ? 'connected' : 'unreachable',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      dbHealthy ? 'Smart Campus Unified API is healthy' : 'API is running but the database is unreachable',
      dbHealthy ? 200 : 503
    );
  });

  // API documentation
  const openApiDocument = loadOpenApiDocument();
  if (openApiDocument) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  }

  // Modular API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/classroom', classroomRoutes);
  app.use('/api/v1/classrooms', classroomRoutes); // Alias
  app.use('/api/v1/medical-help', medicalRoutes);
  app.use('/api/v1/emergency', medicalRoutes); // Alias
  app.use('/api/v1/cafeteria', cafeteriaRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/uploads', uploadRoutes);

  // 404 handler
  app.use('*', (req: Request, res: Response, next) => {
    next(new NotFoundError(`Endpoint ${req.originalUrl} not found`));
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};
