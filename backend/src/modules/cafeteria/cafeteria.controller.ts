import { Request, Response, NextFunction } from 'express';
import { cafeteriaService } from './cafeteria.service';
import { sendSuccess } from '../../utils/response';
import { Role } from '@prisma/client';
import { menuQuerySchema, orderListQuerySchema, reviewListQuerySchema } from './cafeteria.schema';
import { getPagination, buildMeta } from '../../utils/pagination';

export class CafeteriaController {
  async getMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const query = menuQuerySchema.parse(req.query);
      // Removed dishes are only visible to the people who can restore them.
      const isStaff = req.user?.role === Role.CAFETERIA_STAFF || req.user?.role === Role.ADMIN;
      const menu = await cafeteriaService.getMenu({ ...query, includeArchived: isStaff && query.includeArchived });
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

  async updateOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const offer = await cafeteriaService.updateOffer(req.params.id, req.body);
      return sendSuccess(res, offer, 'Offer updated');
    } catch (error) {
      return next(error);
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const isStaffOrAdmin = req.user?.role === Role.CAFETERIA_STAFF || req.user?.role === Role.ADMIN;
      const query = orderListQuerySchema.parse(req.query);
      const userId = isStaffOrAdmin && query.all ? undefined : req.user?.userId;
      const { skip, take, page, limit } = getPagination(req);

      const { orders, total } = await cafeteriaService.getOrders({
        userId,
        status: query.status,
        search: query.search,
        from: query.from,
        to: query.to,
        skip,
        take,
      });
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

  async getReorderLines(req: Request, res: Response, next: NextFunction) {
    try {
      const lines = await cafeteriaService.getReorderLines(req.params.id, { userId: req.user!.userId, role: req.user!.role });
      return sendSuccess(res, lines, 'Reorder lines retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { skip, take, page, limit } = getPagination(req);
      const { rating } = reviewListQuerySchema.parse(req.query);
      const { reviews, total, distribution } = await cafeteriaService.getReviews(req.params.id, { rating, skip, take });
      return sendSuccess(res, { reviews, distribution }, 'Reviews retrieved', 200, buildMeta(page, limit, total));
    } catch (error) {
      return next(error);
    }
  }

  async getMyReview(req: Request, res: Response, next: NextFunction) {
    try {
      const state = await cafeteriaService.getMyReviewState(req.params.id, req.user!.userId);
      return sendSuccess(res, state, 'Review state retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async upsertReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await cafeteriaService.upsertReview(req.params.id, req.user!.userId, req.body);
      return sendSuccess(res, review, 'Review saved');
    } catch (error) {
      return next(error);
    }
  }

  async deleteMyReview(req: Request, res: Response, next: NextFunction) {
    try {
      await cafeteriaService.deleteMyReview(req.params.id, req.user!.userId);
      return sendSuccess(res, null, 'Review removed');
    } catch (error) {
      return next(error);
    }
  }

  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      await cafeteriaService.deleteReview(req.params.id, req.params.reviewId);
      return sendSuccess(res, null, 'Review removed');
    } catch (error) {
      return next(error);
    }
  }

  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, await cafeteriaService.getStats(), 'Cafeteria stats retrieved');
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
