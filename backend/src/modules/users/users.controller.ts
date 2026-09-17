import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess } from '../../utils/response';
import { Role } from '@prisma/client';

export class UsersController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role as Role | undefined;
      const users = await usersService.getAllUsers(role);
      return sendSuccess(res, users, 'Users retrieved successfully');
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

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const updated = await usersService.updateUserRole(req.params.id, role);
      return sendSuccess(res, updated, 'User role updated successfully');
    } catch (error) {
      return next(error);
    }
  }
}

export const usersController = new UsersController();
