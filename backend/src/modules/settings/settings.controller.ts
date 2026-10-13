import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import { settingsService } from './settings.service';

export class SettingsController {
  async get(_req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, await settingsService.getAll(), 'Settings retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.update(req.body, { userId: req.user!.userId, role: req.user!.role });
      return sendSuccess(res, settings, 'Settings updated');
    } catch (error) {
      return next(error);
    }
  }
}

export const settingsController = new SettingsController();
