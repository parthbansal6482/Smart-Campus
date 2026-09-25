import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess } from '../../utils/response';
import { Role } from '@prisma/client';
import { getPagination, buildMeta } from '../../utils/pagination';

export class UsersController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role as Role | undefined;
      const search = req.query.search as string | undefined;
      const { skip, take, page, limit } = getPagination(req);

      const { users, total } = await usersService.getAllUsers({ role, search, skip, take });
      return sendSuccess(res, users, 'Users retrieved successfully', 200, buildMeta(page, limit, total));
    } catch (error) {
      return next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.getUserById(req.params.id);
      return sendSuccess(res, user, 'User details retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.createUser(req.body, req.user!.userId);
      return sendSuccess(res, user, 'Account created successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await usersService.updateUserRole(req.params.id, req.body.role, req.user!.userId);
      return sendSuccess(res, updated, 'User role updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  async updateActive(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await usersService.updateActiveStatus(req.params.id, req.body.isActive, req.user!.userId);
      return sendSuccess(res, updated, 'User status updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await usersService.updateProfile(req.user!.userId, req.body);
      return sendSuccess(res, updated, 'Profile updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  async updatePushToken(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.updatePushToken(req.user!.userId, req.body.expoPushToken);
      return sendSuccess(res, null, 'Push token saved');
    } catch (error) {
      return next(error);
    }
  }
}

export const usersController = new UsersController();
