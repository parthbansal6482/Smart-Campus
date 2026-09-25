import { Request, Response, NextFunction } from 'express';
import { classroomsService } from './classrooms.service';
import { sendSuccess } from '../../utils/response';
import { getPagination, buildMeta } from '../../utils/pagination';
import { Role } from '@prisma/client';

export class ClassroomsController {
  // Buildings
  async getBuildings(req: Request, res: Response, next: NextFunction) {
    try {
      const buildings = await classroomsService.getBuildings();
      return sendSuccess(res, buildings, 'Buildings retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async createBuilding(req: Request, res: Response, next: NextFunction) {
    try {
      const building = await classroomsService.createBuilding(req.body);
      return sendSuccess(res, building, 'Building created successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  // Rooms
  async getRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const { buildingId, isOccupied, minCapacity } = req.query;
      const rooms = await classroomsService.getRooms({
        buildingId: buildingId as string,
        isOccupied: isOccupied !== undefined ? isOccupied === 'true' : undefined,
        minCapacity: minCapacity ? parseInt(minCapacity as string, 10) : undefined,
      });
      return sendSuccess(res, rooms, 'Classrooms retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getAvailableRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const { startTime, endTime, minCapacity, buildingId } = req.query;
      const rooms = await classroomsService.getAvailableRooms({
        startTime: new Date(startTime as string),
        endTime: new Date(endTime as string),
        minCapacity: minCapacity ? parseInt(minCapacity as string, 10) : undefined,
        buildingId: buildingId as string | undefined,
      });
      return sendSuccess(res, rooms, 'Available classrooms retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getRoomById(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await classroomsService.getRoomById(req.params.id);
      return sendSuccess(res, room, 'Classroom details retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await classroomsService.createRoom(req.body);
      return sendSuccess(res, room, 'Classroom created successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateFacilities(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await classroomsService.updateFacilities(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, room, 'Classroom facilities updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  // Recurring schedules
  async getSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const schedules = await classroomsService.getSchedules(req.query.roomId as string | undefined);
      return sendSuccess(res, schedules, 'Schedules retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async createSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await classroomsService.createSchedule(req.body);
      return sendSuccess(res, schedule, 'Schedule created successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async deleteSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      await classroomsService.deleteSchedule(req.params.id);
      return sendSuccess(res, null, 'Schedule removed successfully');
    } catch (error) {
      return next(error);
    }
  }

  // Bookings
  async getBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const isPrivileged = req.user?.role === Role.ADMIN || req.user?.role === Role.FACULTY;
      const userId = isPrivileged && req.query.all === 'true' ? undefined : req.user?.userId;
      const { skip, take, page, limit } = getPagination(req);

      const { bookings, total } = await classroomsService.getBookings({ userId, skip, take });
      return sendSuccess(res, bookings, 'Bookings retrieved successfully', 200, buildMeta(page, limit, total));
    } catch (error) {
      return next(error);
    }
  }

  async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await classroomsService.createBooking(req.user!.userId, req.body);
      return sendSuccess(res, booking, 'Classroom booked successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateBookingStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await classroomsService.updateBookingStatus(req.params.id, req.body.status, {
        userId: req.user!.userId,
        role: req.user!.role,
      });
      return sendSuccess(res, booking, 'Booking status updated successfully');
    } catch (error) {
      return next(error);
    }
  }
}

export const classroomsController = new ClassroomsController();
