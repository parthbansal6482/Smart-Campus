import { z } from 'zod';
import { Role } from '@prisma/client';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Only reachable by an ADMIN (see users.routes.ts) — this is the one place
// a non-STUDENT role can be assigned, unlike public self-registration.
export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    role: z.nativeEnum(Role),
    phone: z.string().optional(),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.nativeEnum(Role),
  }),
});

export const updateActiveSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const updatePushTokenSchema = z.object({
  body: z.object({
    expoPushToken: z.string().min(1).nullable(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
  }),
});
