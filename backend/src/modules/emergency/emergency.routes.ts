import { Router } from 'express';
import { emergencyController } from './emergency.controller';
import { authenticate, requireRoles } from '../../middleware/authGuard';
import { validate } from '../../middleware/validate';
import { createEmergencySchema, updateEmergencyStatusSchema } from './emergency.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Trigger emergency (any authenticated student/faculty/staff)
router.post('/trigger', validate(createEmergencySchema), emergencyController.trigger);

// Active & all emergencies (Responders, Admins)
router.get('/active', requireRoles(Role.RESPONDER, Role.ADMIN), emergencyController.getActive);
router.get('/', requireRoles(Role.RESPONDER, Role.ADMIN), emergencyController.getAll);
router.get('/:id', emergencyController.getById);

// Update status (Responders, Admins)
router.patch(
  '/:id/status',
  requireRoles(Role.RESPONDER, Role.ADMIN),
  validate(updateEmergencyStatusSchema),
  emergencyController.updateStatus
);

export const emergencyRoutes = router;
