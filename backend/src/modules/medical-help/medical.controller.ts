import { Request, Response, NextFunction } from 'express';
import { medicalService } from './medical.service';
import { sendSuccess } from '../../utils/response';
import { MedicineCategory, MedicineOrderStatus, ConsultationStatus, EmergencyStatus, Role } from '@prisma/client';
import { getSocketIO } from '../../sockets/socket.server';

export class MedicalController {
  // Emergencies
  async getActiveEmergencies(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await medicalService.getActiveEmergencies();
      return sendSuccess(res, data, 'Active emergency dispatches retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async getAllEmergencies(req: Request, res: Response, next: NextFunction) {
    try {
      const isStaff = req.user?.role === Role.MEDICAL_STAFF || req.user?.role === Role.AMBULANCE_RESPONDER || req.user?.role === Role.ADMIN;
      const userId = isStaff && req.query.all === 'true' ? undefined : req.user?.userId;
      const data = await medicalService.getAllEmergencies(userId);
      return sendSuccess(res, data, 'Emergencies retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async triggerEmergency(req: Request, res: Response, next: NextFunction) {
    try {
      const emergency = await medicalService.triggerEmergency(req.user!.userId, req.body);
      try {
        const io = getSocketIO();
        io.to('emergency-responders').emit('emergency:new', emergency);
      } catch {}
      return sendSuccess(res, emergency, 'Emergency dispatch alert sent', 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateEmergencyStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await medicalService.updateEmergencyStatus(req.params.id, req.body.status, req.body.responderId);
      try {
        const io = getSocketIO();
        io.to('emergency-responders').emit('emergency:status_changed', updated);
        io.to(`emergency-user-${updated.userId}`).emit('emergency:status_changed', updated);
      } catch {}
      return sendSuccess(res, updated, 'Emergency status updated');
    } catch (error) {
      return next(error);
    }
  }

  // Medicines
  async getMedicines(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as MedicineCategory | undefined;
      const search = req.query.search as string | undefined;
      const data = await medicalService.getMedicines(category, search);
      return sendSuccess(res, data, 'Medicines retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async createMedicine(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await medicalService.createMedicine(req.body);
      return sendSuccess(res, data, 'Medicine item created', 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateMedicine(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await medicalService.updateMedicine(req.params.id, req.body);
      return sendSuccess(res, data, 'Medicine item updated');
    } catch (error) {
      return next(error);
    }
  }

  async deleteMedicine(req: Request, res: Response, next: NextFunction) {
    try {
      await medicalService.deleteMedicine(req.params.id);
      return sendSuccess(res, null, 'Medicine item deleted');
    } catch (error) {
      return next(error);
    }
  }

  async getMedicineOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const isStaff = req.user?.role === Role.MEDICAL_STAFF || req.user?.role === Role.ADMIN;
      const userId = isStaff && req.query.all === 'true' ? undefined : req.user?.userId;
      const data = await medicalService.getMedicineOrders(userId);
      return sendSuccess(res, data, 'Medicine orders retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async createMedicineOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await medicalService.createMedicineOrder(req.user!.userId, req.body);
      return sendSuccess(res, order, 'Medicine order placed', 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateMedicineOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await medicalService.updateMedicineOrderStatus(req.params.id, req.body.status as MedicineOrderStatus);
      return sendSuccess(res, updated, 'Medicine order status updated');
    } catch (error) {
      return next(error);
    }
  }

  // Consultations
  async getConsultations(req: Request, res: Response, next: NextFunction) {
    try {
      const isStaff = req.user?.role === Role.MEDICAL_STAFF || req.user?.role === Role.ADMIN;
      const userId = isStaff && req.query.all === 'true' ? undefined : req.user?.userId;
      const data = await medicalService.getConsultations(userId);
      return sendSuccess(res, data, 'Consultation requests retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async requestConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await medicalService.requestConsultation(req.user!.userId, req.body);
      return sendSuccess(res, data, 'Consultation request submitted', 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateConsultationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await medicalService.updateConsultationStatus(req.params.id, req.body.status as ConsultationStatus, req.body.assignedTo);
      return sendSuccess(res, updated, 'Consultation status updated');
    } catch (error) {
      return next(error);
    }
  }
}

export const medicalController = new MedicalController();
