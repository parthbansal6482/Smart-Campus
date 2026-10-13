import { Router } from 'express';
import { authenticate, requireRoles } from '../../middleware/authGuard';
import { validate } from '../../middleware/validate';
import { Role } from '@prisma/client';
import { settingsController } from './settings.controller';
import { updateSettingsSchema } from './settings.definitions';

const router = Router();

router.use(authenticate);

// Anyone signed in can read the campus settings (hotline, kitchen hours...).
router.get('/', settingsController.get);

// Which keys a role may change is enforced per key in the service.
router.put(
  '/',
  requireRoles(Role.ADMIN, Role.CAFETERIA_STAFF, Role.MEDICAL_STAFF),
  validate(updateSettingsSchema),
  settingsController.update
);

export const settingsRoutes = router;
