import { Router } from 'express';
import { classroomsController } from './classrooms.controller';
import { authenticate, requireRoles } from '../../middleware/authGuard';
import { validate } from '../../middleware/validate';
import {
  createBuildingSchema,
  createRoomSchema,
  updateFacilitySchema,
  availableRoomsQuerySchema,
  createBookingSchema,
  updateBookingStatusSchema,
  createScheduleSchema,
} from './classrooms.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Buildings
router.get('/buildings', classroomsController.getBuildings);
router.post('/buildings', requireRoles(Role.ADMIN), validate(createBuildingSchema), classroomsController.createBuilding);

// Rooms — /available must be registered before /:id so it isn't swallowed by the param route.
router.get('/rooms/available', validate(availableRoomsQuerySchema), classroomsController.getAvailableRooms);
router.get('/rooms', classroomsController.getRooms);
router.get('/rooms/:id', classroomsController.getRoomById);
router.post('/rooms', requireRoles(Role.ADMIN), validate(createRoomSchema), classroomsController.createRoom);
router.patch('/rooms/:id/facilities', requireRoles(Role.ADMIN, Role.FACULTY), validate(updateFacilitySchema), classroomsController.updateFacilities);

// Recurring class schedules
router.get('/schedules', classroomsController.getSchedules);
router.post('/schedules', requireRoles(Role.ADMIN), validate(createScheduleSchema), classroomsController.createSchedule);
router.delete('/schedules/:id', requireRoles(Role.ADMIN), classroomsController.deleteSchedule);

// Bookings
router.get('/bookings', classroomsController.getBookings);
router.post('/bookings', validate(createBookingSchema), classroomsController.createBooking);
router.patch('/bookings/:id/status', validate(updateBookingStatusSchema), classroomsController.updateBookingStatus);

export const classroomRoutes = router;
