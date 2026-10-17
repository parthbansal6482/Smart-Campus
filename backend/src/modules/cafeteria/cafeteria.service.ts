import { prisma } from '../../config/db';
import { MenuCategory, OrderStatus, OrderType, Prisma, Role } from '@prisma/client';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { settingsService } from '../settings/settings.service';
import { emitMenuChanged, emitReviewsChanged } from './cafeteria.events';
import { ORDER_FLOW, averageRating, canTransition, isValidPickupTime, isWithinOpeningHours } from './orderRules';
import { notifyUser, notifyRoles } from '../../services/notification.service';
import { getSocketIO } from '../../sockets/socket.server';

const orderInclude = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  orderItems: { include: { menuItem: true } },
} as const;

// Optional nutrition facts and extra photos, shared by create and update.
export interface MenuItemDetails {
  stock: number;
  galleryUrls: string[];
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
  ingredients: string[];
  allergens: string[];
}

/** Scalar nutrition fields that an update may reset to null. */
type ClearableDetail = 'stock' | 'servingSize' | 'calories' | 'proteinG' | 'carbsG' | 'fatG' | 'fiberG' | 'sugarG' | 'sodiumMg';
type ClearableDetails = { [K in ClearableDetail]?: MenuItemDetails[K] | null };

export class CafeteriaService {
  // Menu items
  async getMenu(opts: {
    category?: MenuCategory;
    isVeg?: boolean;
    search?: string;
    sort?: 'name' | 'price_asc' | 'price_desc' | 'rating' | 'popular' | 'calories';
    maxCalories?: number;
    excludeAllergens?: string[];
    inStockOnly?: boolean;
    includeArchived?: boolean;
  }) {
    const sort = opts.sort ?? 'name';
    const orderBy: Prisma.MenuItemOrderByWithRelationInput[] =
      sort === 'price_asc'
        ? [{ price: 'asc' }, { name: 'asc' }]
        : sort === 'price_desc'
          ? [{ price: 'desc' }, { name: 'asc' }]
          : sort === 'rating'
            ? [{ rating: 'desc' }, { reviewCount: 'desc' }, { name: 'asc' }]
            : sort === 'calories'
              ? [{ calories: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }]
              : [{ name: 'asc' }];

    let items = await prisma.menuItem.findMany({
      where: {
        isArchived: opts.includeArchived ? undefined : false,
        category: opts.category || undefined,
        isVeg: opts.isVeg !== undefined ? opts.isVeg : undefined,
        name: opts.search ? { contains: opts.search, mode: 'insensitive' } : undefined,
        calories: opts.maxCalories !== undefined ? { lte: opts.maxCalories } : undefined,
        isAvailable: opts.inStockOnly ? true : undefined,
      },
      orderBy,
    });

    // Allergens are free text entered by staff, so match case-insensitively in memory.
    if (opts.excludeAllergens?.length) {
      const excluded = new Set(opts.excludeAllergens);
      items = items.filter(item => !item.allergens.some(a => excluded.has(a.trim().toLowerCase())));
    }

    if (sort === 'popular') {
      const sold = await prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: { order: { status: { not: OrderStatus.CANCELLED } } },
        _sum: { quantity: true },
      });
      const soldBy = new Map(sold.map(r => [r.menuItemId, r._sum.quantity ?? 0]));
      items = [...items].sort((a, b) => (soldBy.get(b.id) ?? 0) - (soldBy.get(a.id) ?? 0) || a.name.localeCompare(b.name));
    }

    return items;
  }

  async getMenuItemById(id: string) {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Menu item not found');
    return item;
  }

  async createMenuItem(data: {
    name: string;
    description?: string;
    price: number;
    category: MenuCategory;
    isVeg: boolean;
    spiceLevel: number;
    rating: number;
    isAvailable: boolean;
    imageUrl?: string;
  } & Partial<MenuItemDetails>) {
    // A dish created with no portions left can't be ordered.
    const created = await prisma.menuItem.create({ data: data.stock === 0 ? { ...data, isAvailable: false } : data });
    emitMenuChanged([created.id], 'created');
    return created;
  }

  async updateMenuItem(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      category: MenuCategory;
      isVeg: boolean;
      spiceLevel: number;
      rating: number;
      isAvailable: boolean;
      isArchived: boolean;
      imageUrl: string;
    }> &
      Partial<Omit<MenuItemDetails, ClearableDetail>> &
      ClearableDetails
  ) {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Menu item not found');

    // Stock drives availability at its edges: hitting 0 sells the item out,
    // and restocking a sold-out item puts it back on the menu (unless staff
    // explicitly set availability in the same request).
    const patch = { ...data };
    if (patch.isAvailable === undefined && typeof patch.stock === 'number') {
      if (patch.stock === 0) patch.isAvailable = false;
      else if (item.stock === 0 && !item.isAvailable) patch.isAvailable = true;
    }
    // A dish with no portions can't be available, even if staff ask for it.
    const effectiveStock = patch.stock === undefined ? item.stock : patch.stock;
    if (effectiveStock === 0 && patch.isAvailable === true) patch.isAvailable = false;
    const updated = await prisma.menuItem.update({ where: { id }, data: patch });
    emitMenuChanged([id], patch.isArchived === true ? 'archived' : 'updated');
    return updated;
  }

  /** Archives rather than deletes, so historical order line items keep referring to a real record. */
  async archiveMenuItem(id: string) {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Menu item not found');
    const archived = await prisma.menuItem.update({ where: { id }, data: { isArchived: true, isAvailable: false } });
    emitMenuChanged([id], 'archived');
    return archived;
  }

  // Offers & Daily Specials
  async getOffers() {
    return prisma.offer.findMany({
      where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOffer(data: {
    title: string;
    description?: string;
    code: string;
    discountPercent: number;
    isBanner: boolean;
    imageUrl?: string;
    expiresAt?: string;
    maxRedemptions?: number;
  }) {
    return prisma.offer.create({
      data: { ...data, expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined },
    });
  }

  async updateOffer(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      discountPercent: number;
      isBanner: boolean;
      isActive: boolean;
      imageUrl: string;
      expiresAt: string | null;
      maxRedemptions: number | null;
    }>
  ) {
    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer) throw new NotFoundError('Offer not found');

    return prisma.offer.update({
      where: { id },
      data: {
        ...data,
        expiresAt: data.expiresAt === undefined ? undefined : data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
  }

  // Orders & Tokens
  async getOrders(params: {
    userId?: string;
    status?: OrderStatus;
    activeOnly?: boolean;
    search?: string;
    from?: string;
    to?: string;
    skip: number;
    take: number;
  }) {
    const where: Prisma.OrderWhereInput = {
      userId: params.userId,
      status:
        params.activeOnly === undefined
          ? params.status
          : { in: params.activeOnly ? ORDER_FLOW.filter(s => s !== OrderStatus.COLLECTED) : [OrderStatus.COLLECTED, OrderStatus.CANCELLED] },
    };

    if (params.from || params.to) {
      where.createdAt = {
        gte: params.from ? new Date(params.from) : undefined,
        lte: params.to ? new Date(params.to) : undefined,
      };
    }

    if (params.search) {
      // "#ORD-0007", "ord-7" and "7" all find order number 7; anything else is a customer name (staff view only).
      const digits = params.search.replace(/\D/g, '');
      const byNumber = /^#?(ord-?)?\d+$/i.test(params.search) && digits ? { orderNumber: Number(digits) } : undefined;
      where.OR = [
        ...(byNumber ? [byNumber] : []),
        ...(params.userId ? [] : [{ user: { name: { contains: params.search, mode: 'insensitive' as const } } }]),
      ];
      if (where.OR.length === 0) where.OR = [{ orderNumber: -1 }];
    }

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      prisma.order.count({ where }),
    ]);
    return { orders, total };
  }

  /**
   * What it would take to order the same things again: each line of a past order with the
   * dish's current price and availability. Doesn't create an order — the client puts the
   * available lines in the cart so the customer can review before paying.
   */
  async getReorderLines(id: string, requester: { userId: string; role: Role }) {
    const order = await this.getOrderById(id, requester);
    return order.orderItems.map(line => {
      const { menuItem } = line;
      const available = menuItem.isAvailable && !menuItem.isArchived && (menuItem.stock === null || menuItem.stock >= line.quantity);
      return { menuItem, quantity: line.quantity, previousUnitPrice: line.unitPrice, available };
    });
  }

  async getOrderById(id: string, requester: { userId: string; role: Role }) {
    const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
    if (!order) throw new NotFoundError('Order not found');

    const isOwner = order.userId === requester.userId;
    const isStaff = requester.role === Role.CAFETERIA_STAFF || requester.role === Role.ADMIN;
    if (!isOwner && !isStaff) {
      throw new ForbiddenError('You do not have access to this order');
    }

    return order;
  }

  async createOrder(
    userId: string,
    data: {
      orderType: OrderType;
      tableNumber?: string;
      pickupTime?: string;
      note?: string;
      offerCode?: string;
      items: Array<{ menuItemId: string; quantity: number }>;
    }
  ) {
    const { cafeteriaOpensAt: opensAt, cafeteriaClosesAt: closesAt } = await settingsService.getAll();
    if (!isWithinOpeningHours(new Date(), opensAt || undefined, closesAt || undefined)) {
      throw new BadRequestError(`The kitchen is closed right now — it's open ${opensAt}–${closesAt}`);
    }
    if (data.pickupTime) {
      const pickup = new Date(data.pickupTime);
      if (!isValidPickupTime(pickup)) {
        throw new BadRequestError('Pickup time must be between now and the next 24 hours');
      }
      if (!isWithinOpeningHours(pickup, opensAt || undefined, closesAt || undefined)) {
        throw new BadRequestError(`The cafeteria is open ${opensAt}–${closesAt}; pick a time within those hours`);
      }
    }

    // Merge duplicate lines for the same item instead of rejecting the
    // order outright — a client sending two lines for the same dish is a
    // normal thing to happen (e.g. adding one item twice from the UI).
    const quantityByItem = new Map<string, number>();
    for (const item of data.items) {
      quantityByItem.set(item.menuItemId, (quantityByItem.get(item.menuItemId) ?? 0) + item.quantity);
    }
    const itemIds = Array.from(quantityByItem.keys());

    const dbItems = await prisma.menuItem.findMany({ where: { id: { in: itemIds } } });
    if (dbItems.length !== itemIds.length) {
      throw new BadRequestError('One or more selected menu items do not exist');
    }

    let subtotal = 0;
    const orderItemData: Array<{ menuItemId: string; quantity: number; unitPrice: number }> = [];

    for (const dbItem of dbItems) {
      const quantity = quantityByItem.get(dbItem.id)!;
      if (!dbItem.isAvailable || dbItem.isArchived) {
        throw new BadRequestError(`${dbItem.name} is currently unavailable`);
      }
      if (dbItem.stock !== null && dbItem.stock < quantity) {
        throw new BadRequestError(`Only ${dbItem.stock} left of ${dbItem.name}`);
      }
      subtotal += dbItem.price * quantity;
      orderItemData.push({ menuItemId: dbItem.id, quantity, unitPrice: dbItem.price });
    }

    // orderNumber is a DB-generated autoincrement, so the human-readable
    // token derived from it can never collide the way a random 3-digit
    // suffix could.
    // Claim in a fixed order so two orders sharing dishes can't deadlock each other.
    orderItemData.sort((a, b) => a.menuItemId.localeCompare(b.menuItemId));

    const order = await prisma.$transaction(async tx => {
      // Claim stock atomically: the conditional UPDATE only matches while enough portions remain,
      // so two simultaneous orders can't both take the last one. Selling the last portion marks
      // the item unavailable.
      for (const line of orderItemData) {
        const claimed = await tx.$executeRaw`
          UPDATE menu_items
          SET stock = stock - ${line.quantity},
              is_available = CASE WHEN stock - ${line.quantity} = 0 THEN false ELSE is_available END
          WHERE id = ${line.menuItemId} AND stock IS NOT NULL AND stock >= ${line.quantity}
        `;
        if (claimed === 0) {
          const current = await tx.menuItem.findUnique({ where: { id: line.menuItemId } });
          if (current && current.stock !== null) {
            throw new BadRequestError(`Only ${current.stock} left of ${current.name}`);
          }
        }
      }

      let discountAmount = 0;
      let appliedOfferCode: string | undefined;

      if (data.offerCode) {
        // Atomically validate-and-increment in one statement: a plain
        // read-then-write would let two concurrent orders both see
        // "1 redemption left" and both succeed, letting a limited offer be
        // used more times than intended. The conditional UPDATE only
        // matches (and only then increments) a row that is still active,
        // unexpired, and under its redemption limit.
        const redeemed = await tx.$queryRaw<Array<{ code: string; discount_percent: number }>>`
          UPDATE offers
          SET redemption_count = redemption_count + 1
          WHERE code = ${data.offerCode.toUpperCase()}
            AND is_active = true
            AND (expires_at IS NULL OR expires_at >= now())
            AND (max_redemptions IS NULL OR redemption_count < max_redemptions)
          RETURNING code, discount_percent
        `;

        if (redeemed.length === 0) {
          throw new BadRequestError('This offer code is invalid, expired, or has reached its usage limit');
        }

        discountAmount = Math.round(subtotal * (redeemed[0].discount_percent / 100) * 100) / 100;
        appliedOfferCode = redeemed[0].code;
      }

      const totalAmount = Math.max(0, subtotal - discountAmount);

      const created = await tx.order.create({
        data: {
          userId,
          orderType: data.orderType,
          tableNumber: data.orderType === OrderType.DINE_IN ? data.tableNumber?.trim() || undefined : undefined,
          orderToken: '', // placeholder, set below once orderNumber is known
          offerCode: appliedOfferCode,
          discountAmount,
          totalAmount,
          pickupTime: data.pickupTime ? new Date(data.pickupTime) : undefined,
          note: data.note,
          status: OrderStatus.PLACED,
          orderItems: { create: orderItemData },
        },
      });

      return tx.order.update({
        where: { id: created.id },
        data: { orderToken: `#ORD-${String(created.orderNumber).padStart(4, '0')}` },
        include: orderInclude,
      });
    });

    // Portions were claimed for any stock-tracked dish in the order.
    const stocked = dbItems.filter(i => i.stock !== null).map(i => i.id);
    if (stocked.length > 0) emitMenuChanged(stocked, 'stock');

    try {
      const io = getSocketIO();
      io.to('cafeteria-staff').emit('order:new', order);
      // The customer's other devices should show the new order too.
      io.to(`user-${order.userId}`).emit('order:new', order);
    } catch {
      /* socket layer not initialized (e.g. tests) */
    }
    // The order is already saved; a failed notification must not make the customer retry and double-order.
    await notifyRoles([Role.CAFETERIA_STAFF, Role.ADMIN], {
      type: 'ORDER',
      title: 'New order',
      body: `${order.orderToken} — ${order.orderItems.length} item(s)`,
      data: { orderId: order.id },
    }).catch(() => undefined);

    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus, actor: { userId: string; role: Role }) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundError('Order not found');

    const isOwner = order.userId === actor.userId;
    const isStaff = actor.role === Role.CAFETERIA_STAFF || actor.role === Role.ADMIN;

    if (order.status === OrderStatus.COLLECTED || order.status === OrderStatus.CANCELLED) {
      throw new ConflictError(`This order is already ${order.status.toLowerCase()} and can no longer be changed`);
    }
    if (!canTransition(order.status, status)) {
      throw new ConflictError(`An order that is ${order.status.toLowerCase()} can't be moved to ${status.toLowerCase()}`);
    }

    if (status === OrderStatus.CANCELLED) {
      if (!isOwner && !isStaff) throw new ForbiddenError('You cannot cancel this order');
      if (isOwner && !isStaff && order.status !== OrderStatus.PLACED) {
        throw new ConflictError('This order is already being prepared and can no longer be cancelled by you — ask the counter staff');
      }
    } else if (!isStaff) {
      throw new ForbiddenError('Only cafeteria staff can update this status');
    }

    const updated = await prisma.$transaction(async tx => {
      // Re-check the status inside the transaction: if two people act at once (or the customer
      // cancels as staff accept), only one wins, so stock and offers are never restored twice.
      const moved = await tx.order.updateMany({ where: { id, status: order.status }, data: { status } });
      if (moved.count === 0) {
        throw new ConflictError('This order was just updated by someone else — refresh and try again');
      }

      // A cancelled order gives its offer redemption back, so a limited
      // offer isn't permanently consumed by an order that never happened.
      if (status === OrderStatus.CANCELLED && order.offerCode) {
        await tx.$executeRaw`
          UPDATE offers SET redemption_count = GREATEST(redemption_count - 1, 0)
          WHERE code = ${order.offerCode}
        `;
      }

      // ...and gives back the portions it reserved, putting a sold-out dish back on the menu.
      if (status === OrderStatus.CANCELLED) {
        const lines = await tx.orderItem.findMany({ where: { orderId: id } });
        for (const line of lines) {
          await tx.$executeRaw`
            UPDATE menu_items
            SET stock = stock + ${line.quantity},
                is_available = CASE WHEN stock = 0 AND is_archived = false THEN true ELSE is_available END
            WHERE id = ${line.menuItemId} AND stock IS NOT NULL
          `;
        }
      }
      return tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
    });

    if (status === OrderStatus.CANCELLED) {
      // Cancelling returned portions to stock-tracked dishes.
      emitMenuChanged(updated.orderItems.map(l => l.menuItemId), 'stock');
    }

    try {
      const io = getSocketIO();
      io.to(`order-${updated.id}`).emit('order:status_updated', updated);
      io.to(`user-${updated.userId}`).emit('order:status_updated', updated);
      io.to('cafeteria-staff').emit('order:status_updated', updated);
    } catch {
      /* socket layer not initialized (e.g. tests) */
    }

    // Don't tell people about a cancellation they just made themselves.
    if (!(status === OrderStatus.CANCELLED && actor.userId === updated.userId)) {
      await notifyUser({
        userId: updated.userId,
        type: 'ORDER',
        title: 'Order update',
        body: `${updated.orderToken} is now ${status.toLowerCase()}`,
        data: { orderId: id, status },
      }).catch(() => undefined);
    }

    return updated;
  }

  // Reviews
  async getReviews(menuItemId: string, opts: { rating?: number; skip: number; take: number }) {
    await this.getMenuItemById(menuItemId);
    const where = { menuItemId, rating: opts.rating };
    const [reviews, total, allRatings] = await prisma.$transaction([
      prisma.menuReview.findMany({
        where,
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: opts.skip,
        take: opts.take,
      }),
      prisma.menuReview.count({ where }),
      prisma.menuReview.findMany({ where: { menuItemId }, select: { rating: true } }),
    ]);
    // Histogram for the whole item (not just the filtered page): { 1: n, ... 5: n }.
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of allRatings) distribution[r.rating] += 1;
    return { reviews, total, distribution };
  }

  /** Whether this user may review the dish (they must have collected an order containing it), and any review they already left. */
  async getMyReviewState(menuItemId: string, userId: string) {
    const [collected, existing] = await Promise.all([
      prisma.orderItem.count({ where: { menuItemId, order: { userId, status: OrderStatus.COLLECTED } } }),
      prisma.menuReview.findUnique({ where: { menuItemId_userId: { menuItemId, userId } } }),
    ]);
    return { canReview: collected > 0, review: existing };
  }

  async upsertReview(menuItemId: string, userId: string, data: { rating: number; comment?: string }) {
    await this.getMenuItemById(menuItemId);
    const { canReview } = await this.getMyReviewState(menuItemId, userId);
    if (!canReview) throw new ForbiddenError('You can review a dish once you have collected an order that includes it');

    const saved = await prisma.$transaction(async tx => {
      const review = await tx.menuReview.upsert({
        where: { menuItemId_userId: { menuItemId, userId } },
        create: { menuItemId, userId, rating: data.rating, comment: data.comment },
        update: { rating: data.rating, comment: data.comment ?? null },
      });
      await this.refreshRating(tx, menuItemId);
      return review;
    });
    emitReviewsChanged(menuItemId);
    emitMenuChanged([menuItemId], 'rating');
    return saved;
  }

  async deleteMyReview(menuItemId: string, userId: string) {
    const existing = await prisma.menuReview.findUnique({ where: { menuItemId_userId: { menuItemId, userId } } });
    if (!existing) throw new NotFoundError('You have not reviewed this dish');
    await prisma.$transaction(async tx => {
      await tx.menuReview.delete({ where: { id: existing.id } });
      await this.refreshRating(tx, menuItemId);
    });
    emitReviewsChanged(menuItemId);
    emitMenuChanged([menuItemId], 'rating');
  }

  /** Staff/admin moderation: remove any customer's review (e.g. abusive text). */
  async deleteReview(menuItemId: string, reviewId: string) {
    const review = await prisma.menuReview.findUnique({ where: { id: reviewId } });
    if (!review || review.menuItemId !== menuItemId) throw new NotFoundError('Review not found');
    await prisma.$transaction(async tx => {
      await tx.menuReview.delete({ where: { id: reviewId } });
      await this.refreshRating(tx, menuItemId);
    });
    emitReviewsChanged(menuItemId);
    emitMenuChanged([menuItemId], 'rating');
  }

  private async refreshRating(tx: Prisma.TransactionClient, menuItemId: string) {
    const rows = await tx.menuReview.findMany({ where: { menuItemId }, select: { rating: true } });
    await tx.menuItem.update({
      where: { id: menuItemId },
      data: { rating: averageRating(rows.map(r => r.rating)), reviewCount: rows.length },
    });
  }

  // Staff insights
  async getStats(now: Date = new Date()) {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const weekStart = new Date(startOfToday);
    weekStart.setDate(weekStart.getDate() - 6);

    const [orders, lowStock] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: weekStart } },
        include: { orderItems: { include: { menuItem: { select: { id: true, name: true } } } } },
      }),
      prisma.menuItem.findMany({
        where: { isArchived: false, stock: { not: null, lte: 5 } },
        select: { id: true, name: true, stock: true },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
    ]);

    const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const trend = new Map<string, { date: string; orders: number; revenue: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      trend.set(dayKey(d), { date: dayKey(d), orders: 0, revenue: 0 });
    }

    const byStatus: Record<string, number> = {};
    const topItems = new Map<string, { id: string; name: string; quantity: number }>();
    const prepMinutes: number[] = [];
    let todayRevenue = 0;
    let todayOrders = 0;

    for (const order of orders) {
      const counted = order.status !== OrderStatus.CANCELLED;
      const bucket = trend.get(dayKey(order.createdAt));
      if (counted && bucket) {
        bucket.orders += 1;
        bucket.revenue = Math.round((bucket.revenue + order.totalAmount) * 100) / 100;
      }
      if (counted) {
        for (const line of order.orderItems) {
          const row = topItems.get(line.menuItemId) ?? { id: line.menuItemId, name: line.menuItem.name, quantity: 0 };
          row.quantity += line.quantity;
          topItems.set(line.menuItemId, row);
        }
      }
      if (order.createdAt >= startOfToday) {
        todayOrders += 1;
        byStatus[order.status] = (byStatus[order.status] ?? 0) + 1;
        if (counted) todayRevenue += order.totalAmount;
        if (order.status === OrderStatus.COLLECTED) {
          prepMinutes.push((order.updatedAt.getTime() - order.createdAt.getTime()) / 60_000);
        }
      }
    }

    return {
      today: {
        orders: todayOrders,
        revenue: Math.round(todayRevenue * 100) / 100,
        avgFulfilmentMinutes: prepMinutes.length ? Math.round(prepMinutes.reduce((a, b) => a + b, 0) / prepMinutes.length) : null,
        byStatus,
      },
      trend: Array.from(trend.values()),
      topItems: Array.from(topItems.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
      lowStock,
    };
  }
}

export const cafeteriaService = new CafeteriaService();
