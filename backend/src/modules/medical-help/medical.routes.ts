import { Router } from 'express';
import { medicalController } from './medical.controller';
import { authenticate, requireRoles } from '../../middleware/authGuard';
import { validate } from '../../middleware/validate';
import {
  triggerEmergencySchema,
  updateEmergencyStatusSchema,
  emergencyLocationPingSchema,
  createMedicineSchema,
  updateMedicineSchema,
  createMedicineOrderSchema,
  updateMedicineOrderStatusSchema,
  requestConsultationSchema,
  updateConsultationSchema,
} from './medical.schema';
import { Role } from '@prisma/client';
import { emergencyLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.use(authenticate);

// Emergency Track
router.post('/emergencies/trigger', emergencyLimiter, validate(triggerEmergencySchema), medicalController.triggerEmergency);
router.get('/emergencies/active', requireRoles(Role.MEDICAL_STAFF, Role.AMBULANCE_RESPONDER, Role.ADMIN), medicalController.getActiveEmergencies);
router.get('/emergencies', medicalController.getAllEmergencies);
router.patch(
  '/emergencies/:id/status',
  validate(updateEmergencyStatusSchema),
  medicalController.updateEmergencyStatus
);
router.post('/emergencies/:id/location', validate(emergencyLocationPingSchema), medicalController.recordLocationPing);
router.get('/emergencies/:id/location', medicalController.getLocationTrail);

// Medicine Store Track
router.get('/medicines', medicalController.getMedicines);
router.post('/medicines', requireRoles(Role.MEDICAL_STAFF, Role.ADMIN), validate(createMedicineSchema), medicalController.createMedicine);
router.patch('/medicines/:id', requireRoles(Role.MEDICAL_STAFF, Role.ADMIN), validate(updateMedicineSchema), medicalController.updateMedicine);
router.delete('/medicines/:id', requireRoles(Role.MEDICAL_STAFF, Role.ADMIN), medicalController.archiveMedicine);

router.get('/medicine-orders', medicalController.getMedicineOrders);
router.post('/medicine-orders', validate(createMedicineOrderSchema), medicalController.createMedicineOrder);
router.patch('/medicine-orders/:id/status', validate(updateMedicineOrderStatusSchema), medicalController.updateMedicineOrderStatus);

// Consultations & Talk to Staff Track
router.get('/consultations', medicalController.getConsultations);
router.post('/consultations', validate(requestConsultationSchema), medicalController.requestConsultation);
router.patch('/consultations/:id/status', requireRoles(Role.MEDICAL_STAFF, Role.ADMIN), validate(updateConsultationSchema), medicalController.updateConsultationStatus);

export const medicalRoutes = router;
