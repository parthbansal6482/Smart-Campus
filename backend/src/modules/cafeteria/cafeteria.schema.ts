import { z } from 'zod';
import { MenuCategory, OrderStatus, OrderType } from '@prisma/client';

export const createMenuItemSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    description: z.string().optional(),
    price: z.number().positive('Price must be greater than 0'),
    category: z.nativeEnum(MenuCategory).default(MenuCategory.SNACKS),
    isVeg: z.boolean().default(true),
    spiceLevel: z.number().int().min(0).max(3).default(0),
    rating: z.number().min(0).max(5).default(4.5),
    isAvailable: z.boolean().default(true),
    imageUrl: z.string().url().optional(),
  }),
});

export const updateMenuItemSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    category: z.nativeEnum(MenuCategory).optional(),
    isVeg: z.boolean().optional(),
    spiceLevel: z.number().int().min(0).max(3).optional(),
    rating: z.number().optional(),
    isAvailable: z.boolean().optional(),
    imageUrl: z.string().url().optional(),
  }),
});

export const createOrderSchema = z.object({
  body: z.object({
    orderType: z.nativeEnum(OrderType).default(OrderType.PICKUP),
    tableNumber: z.string().optional(),
    pickupTime: z.string().datetime().optional(),
    note: z.string().optional(),
    items: z.array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      })
    ).min(1, 'Order must contain at least one item'),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
});

export const createOfferSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    code: z.string().min(3),
    discountPercent: z.number().min(1).max(100),
    isBanner: z.boolean().default(true),
    imageUrl: z.string().url().optional(),
  }),
});
