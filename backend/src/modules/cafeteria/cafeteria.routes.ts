import { Router } from 'express';
import { cafeteriaController } from './cafeteria.controller';
import { authenticate, requireRoles } from '../../middleware/authGuard';
import { validate } from '../../middleware/validate';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  createOrderSchema,
  updateOrderStatusSchema,
} from './cafeteria.schema';
import { Role } from '@prisma/client';

const router = Router();

// Menu items
router.get('/menu', cafeteriaController.getMenu);
router.get('/menu/:id', cafeteriaController.getMenuItemById);

// Protected endpoints
router.use(authenticate);

// Menu management (Staff & Admin)
router.post(
  '/menu',
  requireRoles(Role.STAFF, Role.ADMIN),
  validate(createMenuItemSchema),
  cafeteriaController.createMenuItem
);
router.patch(
  '/menu/:id',
  requireRoles(Role.STAFF, Role.ADMIN),
  validate(updateMenuItemSchema),
  cafeteriaController.updateMenuItem
);
router.delete(
  '/menu/:id',
  requireRoles(Role.STAFF, Role.ADMIN),
  cafeteriaController.deleteMenuItem
);

// Orders
router.get('/orders', cafeteriaController.getOrders);
router.get('/orders/:id', cafeteriaController.getOrderById);
router.post('/orders', validate(createOrderSchema), cafeteriaController.createOrder);
router.patch(
  '/orders/:id/status',
  requireRoles(Role.STAFF, Role.ADMIN),
  validate(updateOrderStatusSchema),
  cafeteriaController.updateOrderStatus
);

export const cafeteriaRoutes = router;
