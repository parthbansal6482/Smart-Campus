import { Request, Response, NextFunction } from 'express';
import { emergencyService } from './emergency.service';
import { sendSuccess } from '../../utils/response';
import { getSocketIO } from '../../sockets/socket.server';

export class EmergencyController {
  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const emergencies = await emergencyService.getActiveEmergencies();
      return sendSuccess(res, emergencies, 'Active emergencies retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const emergencies = await emergencyService.getAllEmergencies();
      return sendSuccess(res, emergencies, 'All emergencies retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const emergency = await emergencyService.getEmergencyById(req.params.id);
      return sendSuccess(res, emergency, 'Emergency details retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async trigger(req: Request, res: Response, next: NextFunction) {
    try {
      const emergency = await emergencyService.triggerEmergency(req.user!.userId, req.body);

      // Broadcast real-time emergency alert to responders/admins
      try {
        const io = getSocketIO();
        io.to('emergency-responders').emit('emergency:new', emergency);
      } catch {
        // Socket broadcast fallback if not initialized
      }

      return sendSuccess(res, emergency, 'Emergency alert triggered successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await emergencyService.updateStatus(req.params.id, req.body.status);

      // Broadcast real-time update
      try {
        const io = getSocketIO();
        io.to('emergency-responders').emit('emergency:status_changed', updated);
        io.to(`emergency-user-${updated.userId}`).emit('emergency:status_changed', updated);
      } catch {
        // Socket broadcast fallback
      }

      return sendSuccess(res, updated, 'Emergency status updated successfully');
    } catch (error) {
      return next(error);
    }
  }
}

export const emergencyController = new EmergencyController();
