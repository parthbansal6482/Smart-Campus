import { prisma } from '../../config/db';
import { BookingStatus, Role } from '@prisma/client';
import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { recordAudit } from '../../utils/audit';
import { getSocketIO } from '../../sockets/socket.server';

interface DaySegment {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

/** Splits a (possibly multi-day) time range into per-calendar-day minute-of-day segments,
 *  so a recurring weekly schedule (keyed by day-of-week + minute-of-day) can be checked
 *  for overlap against an arbitrary start/end timestamp range. */
const splitByDay = (start: Date, end: Date): DaySegment[] => {
  const segments: DaySegment[] = [];
  let cursor = new Date(start);

  while (cursor < end) {
    const dayStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600_000);
    const segmentEnd = end < dayEnd ? end : dayEnd;

    segments.push({
      dayOfWeek: cursor.getDay(),
      startMinute: Math.floor((cursor.getTime() - dayStart.getTime()) / 60_000),
      endMinute: Math.ceil((segmentEnd.getTime() - dayStart.getTime()) / 60_000),
    });

    cursor = segmentEnd;
  }

  return segments;
};

const scheduleConflicts = (
  schedules: { dayOfWeek: number; startMinute: number; endMinute: number }[],
  segments: DaySegment[]
): boolean =>
  segments.some(segment =>
    schedules.some(
      schedule =>
        schedule.dayOfWeek === segment.dayOfWeek &&
        schedule.startMinute < segment.endMinute &&
        schedule.endMinute > segment.startMinute
    )
  );

export class ClassroomsService {
  // Buildings
  async getBuildings() {
    return prisma.building.findMany({
      include: { rooms: true },
      orderBy: { name: 'asc' },
    });
  }

  async createBuilding(data: { name: string; code: string; latitude: number; longitude: number; floorCount?: number }) {
    return prisma.building.create({ data });
  }

  // Rooms
  async getRooms(filters?: { buildingId?: string; isOccupied?: boolean; minCapacity?: number }) {
    return prisma.room.findMany({
      where: {
        buildingId: filters?.buildingId,
        isOccupied: filters?.isOccupied,
        capacity: filters?.minCapacity ? { gte: filters.minCapacity } : undefined,
      },
      include: {
        building: true,
        bookings: {
          where: { endTime: { gte: new Date() }, status: BookingStatus.CONFIRMED },
          orderBy: { startTime: 'asc' },
          take: 3,
        },
      },
      orderBy: { roomNumber: 'asc' },
    });
  }

  /** The actual "find me a free room" search the classroom module exists for: rooms with no
   *  confirmed booking and no recurring class scheduled during the requested window. */
  async getAvailableRooms(params: { startTime: Date; endTime: Date; minCapacity?: number; buildingId?: string }) {
    const segments = splitByDay(params.startTime, params.endTime);
    const daysOfWeek = Array.from(new Set(segments.map(s => s.dayOfWeek)));

    const candidates = await prisma.room.findMany({
      where: {
        buildingId: params.buildingId,
        capacity: params.minCapacity ? { gte: params.minCapacity } : undefined,
        bookings: {
          none: {
            status: BookingStatus.CONFIRMED,
            startTime: { lt: params.endTime },
            endTime: { gt: params.startTime },
          },
        },
      },
      include: {
        building: true,
        schedules: { where: { dayOfWeek: { in: daysOfWeek } } },
      },
      orderBy: { roomNumber: 'asc' },
    });

    return candidates
      .filter(room => !scheduleConflicts(room.schedules, segments))
      .map(({ schedules, ...room }) => room);
  }

  async getRoomById(id: string) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        building: true,
        bookings: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { startTime: 'desc' },
        },
        schedules: true,
      },
    });

    if (!room) {
      throw new NotFoundError('Classroom not found');
    }

    return room;
  }

  async createRoom(data: { buildingId: string; roomNumber: string; floor: number; capacity: number; hasAC?: boolean; hasProjector?: boolean }) {
    return prisma.room.create({ data });
  }

  async updateFacilities(id: string, data: { hasAC?: boolean; hasProjector?: boolean; isOccupied?: boolean }, actorId: string) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      throw new NotFoundError('Classroom not found');
    }

    const updated = await prisma.room.update({ where: { id }, data });

    try {
      getSocketIO().to(`room-${id}`).emit('classroom:occupancy_updated', updated);
      getSocketIO().emit('classroom:list_updated', updated);
    } catch {
      /* socket layer not initialized (e.g. tests) */
    }

    await recordAudit({ actorId, action: 'room.update_facilities', targetType: 'Room', targetId: id, metadata: data });
    return updated;
  }

  // Recurring class schedules
  async getSchedules(roomId?: string) {
    return prisma.classSchedule.findMany({
      where: { roomId },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
    });
  }

  async createSchedule(data: { roomId: string; dayOfWeek: number; startMinute: number; endMinute: number; courseName?: string }) {
    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) {
      throw new NotFoundError('Classroom not found');
    }
    return prisma.classSchedule.create({ data });
  }

  async deleteSchedule(id: string) {
    const schedule = await prisma.classSchedule.findUnique({ where: { id } });
    if (!schedule) {
      throw new NotFoundError('Schedule entry not found');
    }
    await prisma.classSchedule.delete({ where: { id } });
  }

  // Bookings
  async getBookings(params: { userId?: string; skip: number; take: number }) {
    const where = params.userId ? { userId: params.userId } : undefined;
    const [bookings, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        include: {
          room: { include: { building: true } },
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { startTime: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.booking.count({ where }),
    ]);
    return { bookings, total };
  }

  async createBooking(userId: string, data: { roomId: string; startTime: string; endTime: string; purpose?: string }) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) {
      throw new NotFoundError('Classroom not found');
    }

    // Recurring-schedule conflicts are checked at the application level;
    // one-off booking conflicts are additionally enforced by a Postgres
    // EXCLUDE constraint (see the init_hardened_schema migration), which is
    // the only thing that can fully close the race between two concurrent
    // requests for the same room.
    const segments = splitByDay(start, end);
    const schedules = await prisma.classSchedule.findMany({
      where: { roomId: data.roomId, dayOfWeek: { in: segments.map(s => s.dayOfWeek) } },
    });
    if (scheduleConflicts(schedules, segments)) {
      throw new ConflictError('This room has a scheduled class during the requested time');
    }

    try {
      const booking = await prisma.booking.create({
        data: {
          userId,
          roomId: data.roomId,
          startTime: start,
          endTime: end,
          purpose: data.purpose,
          status: BookingStatus.CONFIRMED,
        },
        include: { room: { include: { building: true } } },
      });

      await recordAudit({ actorId: userId, action: 'booking.create', targetType: 'Booking', targetId: booking.id });
      return booking;
    } catch (error) {
      if (error instanceof Error && /exclusion constraint/i.test(error.message)) {
        throw new ConflictError('Classroom is already booked for this time range');
      }
      throw error;
    }
  }

  async updateBookingStatus(id: string, status: BookingStatus, actor: { userId: string; role: Role }) {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const isOwner = booking.userId === actor.userId;
    const isPrivileged = actor.role === Role.ADMIN || actor.role === Role.FACULTY;

    // The owner may only cancel their own booking; confirming/completing a
    // booking (or changing someone else's) is staff-only.
    if (!isPrivileged && !(isOwner && status === BookingStatus.CANCELLED)) {
      throw new ForbiddenError('You can only cancel your own bookings');
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { room: true },
    });

    await recordAudit({
      actorId: actor.userId,
      action: 'booking.status_change',
      targetType: 'Booking',
      targetId: id,
      metadata: { from: booking.status, to: status },
    });

    return updated;
  }
}

export const classroomsService = new ClassroomsService();
