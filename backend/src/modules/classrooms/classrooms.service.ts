import { prisma } from '../../config/db';
import { BookingStatus } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../utils/errors';

export class ClassroomsService {
  // Buildings
  async getBuildings() {
    return prisma.building.findMany({
      include: {
        rooms: true,
      },
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
          where: {
            endTime: { gte: new Date() },
            status: BookingStatus.CONFIRMED,
          },
          orderBy: { startTime: 'asc' },
          take: 3,
        },
      },
      orderBy: { roomNumber: 'asc' },
    });
  }

  async getRoomById(id: string) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        building: true,
        bookings: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { startTime: 'desc' },
        },
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

  async updateFacilities(id: string, data: { hasAC?: boolean; hasProjector?: boolean; isOccupied?: boolean }) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      throw new NotFoundError('Classroom not found');
    }

    return prisma.room.update({
      where: { id },
      data,
    });
  }

  // Bookings
  async getBookings(userId?: string) {
    return prisma.booking.findMany({
      where: userId ? { userId } : undefined,
      include: {
        room: {
          include: { building: true },
        },
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async createBooking(userId: string, data: { roomId: string; startTime: string; endTime: string; purpose?: string }) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      throw new BadRequestError('Start time must be before end time');
    }

    // Check for overlapping confirmed bookings
    const overlap = await prisma.booking.findFirst({
      where: {
        roomId: data.roomId,
        status: BookingStatus.CONFIRMED,
        OR: [
          {
            startTime: { lte: start },
            endTime: { gt: start },
          },
          {
            startTime: { lt: end },
            endTime: { gte: end },
          },
          {
            startTime: { gte: start },
            endTime: { lte: end },
          },
        ],
      },
    });

    if (overlap) {
      throw new BadRequestError('Classroom is already booked for this time range');
    }

    return prisma.booking.create({
      data: {
        userId,
        roomId: data.roomId,
        startTime: start,
        endTime: end,
        purpose: data.purpose,
        status: BookingStatus.CONFIRMED,
      },
      include: {
        room: { include: { building: true } },
      },
    });
  }

  async updateBookingStatus(id: string, status: BookingStatus) {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    return prisma.booking.update({
      where: { id },
      data: { status },
      include: { room: true },
    });
  }
}

export const classroomsService = new ClassroomsService();
