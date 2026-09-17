import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, requireRoles } from '../../middleware/authGuard';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', requireRoles(Role.ADMIN), usersController.getAll);
router.get('/:id', usersController.getById);
router.patch('/:id/role', requireRoles(Role.ADMIN), usersController.updateRole);

export const userRoutes = router;
