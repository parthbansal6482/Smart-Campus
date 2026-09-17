import { z } from 'zod';
import { EmergencyStatus } from '@prisma/client';

export const createEmergencySchema = z.object({
  body: z.object({
    latitude: z.number(),
    longitude: z.number(),
    buildingId: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const updateEmergencyStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(EmergencyStatus),
  }),
});
