import { prisma } from '../../config/db';
import { MenuCategory, OrderStatus, OrderType } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../utils/errors';

export class CafeteriaService {
  // Menu items
  async getMenu(category?: MenuCategory, isVeg?: boolean, search?: string) {
    return prisma.menuItem.findMany({
      where: {
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

  async createMenuItem(data: any) {
    return prisma.menuItem.create({ data });
  }

  async updateMenuItem(id: string, data: any) {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Menu item not found');
    return prisma.menuItem.update({ where: { id }, data });
  }

  async deleteMenuItem(id: string) {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Menu item not found');
    return prisma.menuItem.delete({ where: { id } });
  }

  // Offers & Daily Specials
  async getOffers() {
    return prisma.offer.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createOffer(data: any) {
    return prisma.offer.create({ data });
  }

  // Orders & Tokens
  async getOrders(userId?: string, status?: OrderStatus) {
    return prisma.order.findMany({
      where: {
        userId: userId || undefined,
        status: status || undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        orderItems: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        orderItems: { include: { menuItem: true } },
      },
    });
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  async createOrder(
    userId: string,
    data: {
      orderType: OrderType;
      tableNumber?: string;
      pickupTime?: string;
      note?: string;
      items: Array<{ menuItemId: string; quantity: number }>;
    }
  ) {
    const itemIds = data.items.map(i => i.menuItemId);
    const dbItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
    });

    if (dbItems.length !== itemIds.length) {
      throw new BadRequestError('One or more selected menu items do not exist');
    }

    let totalAmount = 0;
    const orderItemData: Array<{ menuItemId: string; quantity: number; unitPrice: number }> = [];

    for (const item of data.items) {
      const dbItem = dbItems.find(d => d.id === item.menuItemId);
      if (!dbItem || !dbItem.isAvailable) {
        throw new BadRequestError(`Menu item ${dbItem?.name || item.menuItemId} is currently unavailable`);
      }
      totalAmount += dbItem.price * item.quantity;
      orderItemData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: dbItem.price,
      });
    }

    // Generate readable order token e.g. #ORD-108
    const tokenNum = Math.floor(100 + Math.random() * 900);
    const orderToken = `#ORD-${tokenNum}`;

    return prisma.order.create({
      data: {
        userId,
        orderType: data.orderType,
        tableNumber: data.tableNumber,
        orderToken,
        totalAmount,
        pickupTime: data.pickupTime ? new Date(data.pickupTime) : undefined,
        note: data.note,
        status: OrderStatus.PLACED,
        orderItems: { create: orderItemData },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: { include: { menuItem: true } },
      },
    });
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundError('Order not found');

    return prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: { include: { menuItem: true } },
      },
    });
  }
}

export const cafeteriaService = new CafeteriaService();
