import { Router } from 'express';
import { authenticate } from '../../middleware/authGuard';
import { uploadSingleFile } from '../../middleware/upload';
import { uploadsController } from './uploads.controller';

const router = Router();

router.use(authenticate);

router.post('/', uploadSingleFile, uploadsController.upload);

export const uploadRoutes = router;
