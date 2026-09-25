import { Router } from 'express';
import { authenticate } from '../../middleware/authGuard';
import { notificationsController } from './notifications.controller';

const router = Router();

router.use(authenticate);

router.get('/', notificationsController.list);
router.patch('/read-all', notificationsController.markAllRead);
router.patch('/:id/read', notificationsController.markRead);

export const notificationRoutes = router;
