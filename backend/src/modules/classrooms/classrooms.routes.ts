import { Router } from 'express';
import { classroomsController } from './classrooms.controller';
import { authenticate, requireRoles } from '../../middleware/authGuard';
import { validate } from '../../middleware/validate';
import {
  createBuildingSchema,
  createRoomSchema,
  updateFacilitySchema,
  createBookingSchema,
  updateBookingStatusSchema,
} from './classrooms.schema';
import { Role } from '@prisma/client';

const router = Router();

// Public / Authenticated read
router.use(authenticate);

// Buildings
router.get('/buildings', classroomsController.getBuildings);
router.post('/buildings', requireRoles(Role.ADMIN), validate(createBuildingSchema), classroomsController.createBuilding);

// Rooms
router.get('/rooms', classroomsController.getRooms);
router.get('/rooms/:id', classroomsController.getRoomById);
router.post('/rooms', requireRoles(Role.ADMIN), validate(createRoomSchema), classroomsController.createRoom);
router.patch('/rooms/:id/facilities', requireRoles(Role.ADMIN, Role.FACULTY), validate(updateFacilitySchema), classroomsController.updateFacilities);

// Bookings
router.get('/bookings', classroomsController.getBookings);
router.post('/bookings', validate(createBookingSchema), classroomsController.createBooking);
router.patch('/bookings/:id/status', requireRoles(Role.ADMIN, Role.FACULTY), validate(updateBookingStatusSchema), classroomsController.updateBookingStatus);

export const classroomRoutes = router;
