import { Request, Response, NextFunction } from 'express';
import { cafeteriaService } from './cafeteria.service';
import { sendSuccess } from '../../utils/response';
import { MenuCategory, OrderStatus, Role } from '@prisma/client';
import { getPagination, buildMeta } from '../../utils/pagination';

export class CafeteriaController {
  async getMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, isVeg, search } = req.query;
      const menu = await cafeteriaService.getMenu(
        category as MenuCategory | undefined,
        isVeg !== undefined ? isVeg === 'true' : undefined,
        search as string | undefined
      );
      return sendSuccess(res, menu, 'Menu items retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async getMenuItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await cafeteriaService.getMenuItemById(req.params.id);
      return sendSuccess(res, item, 'Menu item retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async createMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await cafeteriaService.createMenuItem(req.body);
      return sendSuccess(res, item, 'Menu item created', 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await cafeteriaService.updateMenuItem(req.params.id, req.body);
      return sendSuccess(res, updated, 'Menu item updated');
    } catch (error) {
      return next(error);
    }
  }

  async archiveMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      await cafeteriaService.archiveMenuItem(req.params.id);
      return sendSuccess(res, null, 'Menu item removed from the catalog');
    } catch (error) {
      return next(error);
    }
  }

  async getOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const offers = await cafeteriaService.getOffers();
      return sendSuccess(res, offers, 'Offers retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async createOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const offer = await cafeteriaService.createOffer(req.body);
      return sendSuccess(res, offer, 'Offer created', 201);
    } catch (error) {
      return next(error);
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const isStaffOrAdmin = req.user?.role === Role.CAFETERIA_STAFF || req.user?.role === Role.ADMIN;
      const userId = isStaffOrAdmin && req.query.all === 'true' ? undefined : req.user?.userId;
      const status = req.query.status as OrderStatus | undefined;
      const { skip, take, page, limit } = getPagination(req);

      const { orders, total } = await cafeteriaService.getOrders({ userId, status, skip, take });
      return sendSuccess(res, orders, 'Orders retrieved', 200, buildMeta(page, limit, total));
    } catch (error) {
      return next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await cafeteriaService.getOrderById(req.params.id, { userId: req.user!.userId, role: req.user!.role });
      return sendSuccess(res, order, 'Order retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await cafeteriaService.createOrder(req.user!.userId, req.body);
      return sendSuccess(res, order, 'Order placed successfully', 201);
    } catch (error) {
      return next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await cafeteriaService.updateOrderStatus(req.params.id, req.body.status, {
        userId: req.user!.userId,
        role: req.user!.role,
      });
      return sendSuccess(res, order, 'Order status updated');
    } catch (error) {
      return next(error);
    }
  }
}

export const cafeteriaController = new CafeteriaController();
