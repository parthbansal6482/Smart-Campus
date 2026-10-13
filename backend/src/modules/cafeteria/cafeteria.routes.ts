import { Router } from 'express';
import { cafeteriaController } from './cafeteria.controller';
import { authenticate, authenticateOptional, requireRoles } from '../../middleware/authGuard';
import { validate } from '../../middleware/validate';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  createOfferSchema,
  updateOfferSchema,
  upsertReviewSchema,
} from './cafeteria.schema';
import { Role } from '@prisma/client';

const router = Router();

// Public / Authenticated read
// Optional auth: signed-in staff may also list removed dishes.
router.get('/menu', authenticateOptional, cafeteriaController.getMenu);
router.get('/menu/:id', cafeteriaController.getMenuItemById);
router.get('/menu/:id/reviews', cafeteriaController.getReviews);
router.get('/offers', cafeteriaController.getOffers);

// Protected routes
router.use(authenticate);

// Menu management (Staff & Admin)
router.post('/menu', requireRoles(Role.CAFETERIA_STAFF, Role.ADMIN), validate(createMenuItemSchema), cafeteriaController.createMenuItem);
router.patch('/menu/:id', requireRoles(Role.CAFETERIA_STAFF, Role.ADMIN), validate(updateMenuItemSchema), cafeteriaController.updateMenuItem);
router.delete('/menu/:id', requireRoles(Role.CAFETERIA_STAFF, Role.ADMIN), cafeteriaController.archiveMenuItem);

router.post('/offers', requireRoles(Role.CAFETERIA_STAFF, Role.ADMIN), validate(createOfferSchema), cafeteriaController.createOffer);
router.patch('/offers/:id', requireRoles(Role.CAFETERIA_STAFF, Role.ADMIN), validate(updateOfferSchema), cafeteriaController.updateOffer);

// Reviews (customers; posting requires a collected order containing the dish)
router.get('/menu/:id/reviews/mine', cafeteriaController.getMyReview);
router.put('/menu/:id/reviews/mine', validate(upsertReviewSchema), cafeteriaController.upsertReview);
router.delete('/menu/:id/reviews/mine', cafeteriaController.deleteMyReview);

// Moderation (Staff & Admin)
router.delete('/menu/:id/reviews/:reviewId', requireRoles(Role.CAFETERIA_STAFF, Role.ADMIN), cafeteriaController.deleteReview);

// Insights (Staff & Admin)
router.get('/stats', requireRoles(Role.CAFETERIA_STAFF, Role.ADMIN), cafeteriaController.getStats);

// Orders
router.get('/orders', cafeteriaController.getOrders);
router.get('/orders/:id', cafeteriaController.getOrderById);
router.get('/orders/:id/reorder', cafeteriaController.getReorderLines);
router.post('/orders', validate(createOrderSchema), cafeteriaController.createOrder);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), cafeteriaController.updateOrderStatus);

export const cafeteriaRoutes = router;
