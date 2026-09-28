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

    // 'local' writes uploads (prescriptions etc.) to disk under UPLOAD_DIR —
    // fine for a single long-lived instance, but the files are lost on every
    // restart/redeploy on ephemeral hosts (Render, Railway, Vercel). 's3'
    // targets any S3-compatible object store (AWS S3, Supabase Storage,
    // Cloudflare R2, MinIO, Backblaze B2) so files survive redeploys.
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    // Only needed for non-AWS S3-compatible providers (R2, MinIO, Supabase
    // Storage's S3 endpoint, etc). Leave unset for real AWS S3.
    S3_ENDPOINT: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),
    // Where uploaded files are publicly reachable from, e.g. a CDN domain or
    // the bucket's own public endpoint. If unset, falls back to the
    // provider's default virtual-hosted-style URL.
    S3_PUBLIC_BASE_URL: z.string().optional(),

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
  })
  .refine(data => data.STORAGE_DRIVER !== 's3' || (data.S3_BUCKET && data.S3_REGION && data.S3_ACCESS_KEY_ID && data.S3_SECRET_ACCESS_KEY), {
    message: 'STORAGE_DRIVER=s3 requires S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.',
    path: ['STORAGE_DRIVER'],
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
