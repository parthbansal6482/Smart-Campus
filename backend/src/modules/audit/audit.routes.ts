import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRoles } from '../../middleware/authGuard';
import { auditController } from './audit.controller';

const router = Router();

router.use(authenticate, requireRoles(Role.ADMIN));

router.get('/', auditController.list);

export const auditRoutes = router;
