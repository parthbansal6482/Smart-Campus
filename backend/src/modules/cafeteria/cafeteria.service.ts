import { prisma } from '../../config/db';
import { MenuCategory, OrderStatus, OrderType, Role } from '@prisma/client';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { notifyUser, notifyRoles } from '../../services/notification.service';
import { getSocketIO } from '../../sockets/socket.server';

const orderInclude = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  orderItems: { include: { menuItem: true } },
} as const;

export class CafeteriaService {
  // Menu items
  async getMenu(category?: MenuCategory, isVeg?: boolean, search?: string) {
    return prisma.menuItem.findMany({
      where: {
        isArchived: false,
        category: category || undefined,
        isVeg: isVeg !== undefined ? isVeg : undefined,
        name: search ? { contains: search, mode: 'insensitive' } : undefined,
      },
      orderBy: { name: 'asc' },
    });
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
  }) {
    return prisma.menuItem.create({ data });
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
      imageUrl: string;
    }>
  ) {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Menu item not found');
    return prisma.menuItem.update({ where: { id }, data });
  }

  /** Archives rather than deletes, so historical order line items keep referring to a real record. */
  async archiveMenuItem(id: string) {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Menu item not found');
    return prisma.menuItem.update({ where: { id }, data: { isArchived: true, isAvailable: false } });
  }

  // Offers & Daily Specials
  async getOffers() {
    return prisma.offer.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  }

  async createOffer(data: { title: string; description?: string; code: string; discountPercent: number; isBanner: boolean; imageUrl?: string }) {
    return prisma.offer.create({ data });
  }

  // Orders & Tokens
  async getOrders(params: { userId?: string; status?: OrderStatus; skip: number; take: number }) {
    const where = { userId: params.userId, status: params.status };
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      prisma.order.count({ where }),
    ]);
    return { orders, total };
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
      subtotal += dbItem.price * quantity;
      orderItemData.push({ menuItemId: dbItem.id, quantity, unitPrice: dbItem.price });
    }

    let discountAmount = 0;
    let appliedOfferCode: string | undefined;
    if (data.offerCode) {
      const offer = await prisma.offer.findUnique({ where: { code: data.offerCode.toUpperCase() } });
      if (!offer || !offer.isActive) {
        throw new BadRequestError('This offer code is not valid');
      }
      discountAmount = Math.round(subtotal * (offer.discountPercent / 100) * 100) / 100;
      appliedOfferCode = offer.code;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    // orderNumber is a DB-generated autoincrement, so the human-readable
    // token derived from it can never collide the way a random 3-digit
    // suffix could.
    const order = await prisma.$transaction(async tx => {
      const created = await tx.order.create({
        data: {
          userId,
          orderType: data.orderType,
          tableNumber: data.tableNumber,
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

    try {
      getSocketIO().to('cafeteria-staff').emit('order:new', order);
    } catch {
      /* socket layer not initialized (e.g. tests) */
    }
    await notifyRoles([Role.CAFETERIA_STAFF, Role.ADMIN], {
      type: 'ORDER',
      title: 'New order',
      body: `${order.orderToken} — ${order.orderItems.length} item(s)`,
      data: { orderId: order.id },
    });

    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus, actor: { userId: string; role: Role }) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundError('Order not found');

    const isOwner = order.userId === actor.userId;
    const isStaff = actor.role === Role.CAFETERIA_STAFF || actor.role === Role.ADMIN;

    if (status === OrderStatus.CANCELLED) {
      if (!isOwner && !isStaff) throw new ForbiddenError('You cannot cancel this order');
      if (isOwner && !isStaff && order.status !== OrderStatus.PLACED) {
        throw new ConflictError('This order is already being prepared and can no longer be cancelled by you — ask the counter staff');
      }
    } else if (!isStaff) {
      throw new ForbiddenError('Only cafeteria staff can update this status');
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });

    try {
      const io = getSocketIO();
      io.to(`order-${updated.id}`).emit('order:status_updated', updated);
      io.to(`user-${updated.userId}`).emit('order:status_updated', updated);
      io.to('cafeteria-staff').emit('order:status_updated', updated);
    } catch {
      /* socket layer not initialized (e.g. tests) */
    }

    await notifyUser({
      userId: updated.userId,
      type: 'ORDER',
      title: 'Order update',
      body: `${updated.orderToken} is now ${status.toLowerCase()}`,
      data: { orderId: id, status },
    });

    return updated;
  }
}

export const cafeteriaService = new CafeteriaService();
