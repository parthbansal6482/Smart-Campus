import { env } from './env';

export const config = {
  env: env.NODE_ENV,
  isProduction: env.isProduction,
  isTest: env.isTest,
  port: env.PORT,
  appBaseUrl: env.APP_BASE_URL,
  clientUrl: env.CLIENT_URL,

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
  },

  cors: {
    // Empty allowlist in non-production means "allow any origin" — convenient
    // for local dev against Expo/Vite's constantly-changing ports. In
    // production an explicit CORS_ORIGINS list is required for the origin
    // check to admit anything (see middleware wiring in app.ts).
    allowedOrigins: (env.CORS_ORIGINS ?? '')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
  },

  upload: {
    dir: env.UPLOAD_DIR,
    maxBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
  },

  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
    configured: Boolean(env.SMTP_HOST && env.SMTP_PORT),
  },

  campus: {
    buildingMatchRadiusMeters: env.BUILDING_MATCH_RADIUS_METERS,
  },
};
