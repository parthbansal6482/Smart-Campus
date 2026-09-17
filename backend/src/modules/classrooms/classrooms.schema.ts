import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

export const createBuildingSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Building name is required'),
    code: z.string().min(2, 'Building code is required'),
    latitude: z.number(),
    longitude: z.number(),
    floorCount: z.number().int().min(1).default(1),
  }),
});

export const createRoomSchema = z.object({
  body: z.object({
    buildingId: z.string().uuid('Valid building ID required'),
    roomNumber: z.string().min(1, 'Room number is required'),
    floor: z.number().int().min(1).default(1),
    capacity: z.number().int().min(1).default(30),
    hasAC: z.boolean().default(true),
    hasProjector: z.boolean().default(true),
  }),
});

export const updateFacilitySchema = z.object({
  body: z.object({
    hasAC: z.boolean().optional(),
    hasProjector: z.boolean().optional(),
    isOccupied: z.boolean().optional(),
  }),
});

export const createBookingSchema = z.object({
  body: z.object({
    roomId: z.string().uuid('Valid room ID required'),
    startTime: z.string().datetime('Valid start time required'),
    endTime: z.string().datetime('Valid end time required'),
    purpose: z.string().optional(),
  }),
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(BookingStatus),
  }),
});
