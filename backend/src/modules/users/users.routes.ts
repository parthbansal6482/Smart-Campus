import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, requireRoles, requireSelfOrRoles } from '../../middleware/authGuard';
import { validate } from '../../middleware/validate';
import { createUserSchema, updateRoleSchema, updateActiveSchema, updatePushTokenSchema, updateProfileSchema } from './users.schema';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', requireRoles(Role.ADMIN), usersController.getAll);
router.post('/', requireRoles(Role.ADMIN), validate(createUserSchema), usersController.create);

router.patch('/me', validate(updateProfileSchema), usersController.updateProfile);
router.put('/me/push-token', validate(updatePushTokenSchema), usersController.updatePushToken);

// Ownership-gated: a user can read their own record, an admin can read anyone's.
router.get('/:id', requireSelfOrRoles(req => req.params.id, Role.ADMIN), usersController.getById);
router.patch('/:id/role', requireRoles(Role.ADMIN), validate(updateRoleSchema), usersController.updateRole);
router.patch('/:id/active', requireRoles(Role.ADMIN), validate(updateActiveSchema), usersController.updateActive);

export const userRoutes = router;
