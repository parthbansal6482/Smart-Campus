import { z } from 'zod';
import { BookingStatus } from '@prisma/client';

const MAX_BOOKING_HOURS = 6;

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
    floor: z.number().int().min(0).default(1),
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

export const availableRoomsQuerySchema = z.object({
  query: z
    .object({
      startTime: z.string().datetime('Valid start time required'),
      endTime: z.string().datetime('Valid end time required'),
      minCapacity: z.coerce.number().int().positive().optional(),
      buildingId: z.string().uuid().optional(),
    })
    .refine(q => new Date(q.startTime) < new Date(q.endTime), {
      message: 'startTime must be before endTime',
      path: ['endTime'],
    }),
});

export const createBookingSchema = z.object({
  body: z
    .object({
      roomId: z.string().uuid('Valid room ID required'),
      startTime: z.string().datetime('Valid start time required'),
      endTime: z.string().datetime('Valid end time required'),
      purpose: z.string().optional(),
    })
    .refine(b => new Date(b.startTime) < new Date(b.endTime), {
      message: 'Start time must be before end time',
      path: ['endTime'],
    })
    .refine(b => new Date(b.startTime).getTime() > Date.now(), {
      message: 'Start time must be in the future',
      path: ['startTime'],
    })
    .refine(b => new Date(b.endTime).getTime() - new Date(b.startTime).getTime() <= MAX_BOOKING_HOURS * 3600_000, {
      message: `A single booking cannot exceed ${MAX_BOOKING_HOURS} hours`,
      path: ['endTime'],
    }),
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(BookingStatus),
  }),
});

export const createScheduleSchema = z.object({
  body: z
    .object({
      roomId: z.string().uuid('Valid room ID required'),
      dayOfWeek: z.number().int().min(0).max(6),
      startMinute: z.number().int().min(0).max(1439),
      endMinute: z.number().int().min(1).max(1440),
      courseName: z.string().optional(),
    })
    .refine(s => s.startMinute < s.endMinute, {
      message: 'startMinute must be before endMinute',
      path: ['endMinute'],
    }),
});
