import { Request, Response, NextFunction } from 'express';
import { cafeteriaService } from './cafeteria.service';
import { sendSuccess } from '../../utils/response';
import { MenuCategory, OrderStatus, Role } from '@prisma/client';
import { getSocketIO } from '../../sockets/socket.server';

export class CafeteriaController {
  // Menu
  async getMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, availableOnly } = req.query;
      const menu = await cafeteriaService.getMenu(
        category as MenuCategory | undefined,
        availableOnly === 'true'
      );
      return sendSuccess(res, menu, 'Menu items retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getMenuItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await cafeteriaService.getMenuItemById(req.params.id);
      return sendSuccess(res, item, 'Menu item retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async createMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await cafeteriaService.createMenuItem(req.body);
      return sendSuccess(res, item, 'Menu item created successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await cafeteriaService.updateMenuItem(req.params.id, req.body);
      return sendSuccess(res, updated, 'Menu item updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  async deleteMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      await cafeteriaService.deleteMenuItem(req.params.id);
      return sendSuccess(res, null, 'Menu item deleted successfully');
    } catch (error) {
      return next(error);
    }
  }

  // Orders
  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const isStaffOrAdmin = req.user?.role === Role.STAFF || req.user?.role === Role.ADMIN;
      const userId = isStaffOrAdmin && req.query.all === 'true' ? undefined : req.user?.userId;
      const status = req.query.status as OrderStatus | undefined;

      const orders = await cafeteriaService.getOrders(userId, status);
      return sendSuccess(res, orders, 'Orders retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await cafeteriaService.getOrderById(req.params.id);
      return sendSuccess(res, order, 'Order retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await cafeteriaService.createOrder(req.user!.userId, req.body);

      // Broadcast new order to cafeteria staff
      try {
        const io = getSocketIO();
        io.to('cafeteria-staff').emit('order:new', order);
      } catch {
        // Socket broadcast fallback
      }

      return sendSuccess(res, order, 'Order placed successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await cafeteriaService.updateOrderStatus(req.params.id, req.body.status);

      // Broadcast order status update to user & staff
      try {
        const io = getSocketIO();
        io.to(`order-${order.id}`).emit('order:status_updated', order);
        io.to(`user-${order.userId}`).emit('order:status_updated', order);
        io.to('cafeteria-staff').emit('order:status_updated', order);
      } catch {
        // Socket broadcast fallback
      }

      return sendSuccess(res, order, 'Order status updated successfully');
    } catch (error) {
      return next(error);
    }
  }
}

export const cafeteriaController = new CafeteriaController();
