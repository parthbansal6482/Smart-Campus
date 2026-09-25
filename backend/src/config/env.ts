import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),

    // In production there is no safe default for a signing secret — a
    // committed fallback here would mean anyone who reads the repo can
    // forge tokens for every account. In development/test we allow a
    // fallback purely so a fresh checkout can run without extra setup.
    JWT_SECRET: z.string().min(1).optional(),
    JWT_EXPIRES_IN: z.string().default('1h'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),

    // Comma-separated list of allowed browser/app origins for CORS.
    // Left unset in development to keep local Expo/Vite ports frictionless.
    CORS_ORIGINS: z.string().optional(),

    UPLOAD_DIR: z.string().default('uploads'),
    MAX_UPLOAD_MB: z.coerce.number().positive().default(5),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().default('Smart Campus <no-reply@smartcampus.edu>'),

    // How close (in metres) an emergency's GPS point must be to a building's
    // recorded coordinates before that building is auto-attached to the
    // alert. Beyond this, the alert is still created immediately — it's
    // just left without a matched building rather than guessing wrong.
    BUILDING_MATCH_RADIUS_METERS: z.coerce.number().positive().default(300),

    APP_BASE_URL: z.string().default('http://localhost:5000'),
    CLIENT_URL: z.string().default('http://localhost:5173'),
  })
  .refine(data => !(data.NODE_ENV === 'production' && !data.JWT_SECRET), {
    message: 'JWT_SECRET must be set explicitly in production — refusing to start with a fallback secret.',
    path: ['JWT_SECRET'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`   - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  JWT_SECRET: parsed.data.JWT_SECRET ?? 'dev-only-insecure-secret-do-not-use-in-production',
  isProduction: isProd,
  isTest: parsed.data.NODE_ENV === 'test',
};
