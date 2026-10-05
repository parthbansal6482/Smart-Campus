import { z } from 'zod';
import { MenuCategory, OrderStatus, OrderType } from '@prisma/client';

const nutritionFields = {
  galleryUrls: z.array(z.string().url()).max(8).optional(),
  servingSize: z.string().max(60).optional(),
  calories: z.number().int().min(0).max(5000).optional(),
  proteinG: z.number().min(0).max(500).optional(),
  carbsG: z.number().min(0).max(500).optional(),
  fatG: z.number().min(0).max(500).optional(),
  fiberG: z.number().min(0).max(500).optional(),
  sugarG: z.number().min(0).max(500).optional(),
  sodiumMg: z.number().min(0).max(20000).optional(),
  ingredients: z.array(z.string().trim().min(1).max(60)).max(40).optional(),
  allergens: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
};

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
    ...nutritionFields,
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
    rating: z.number().min(0).max(5).optional(),
    isAvailable: z.boolean().optional(),
    imageUrl: z.string().url().optional(),
    ...nutritionFields,
  }),
});

export const createOrderSchema = z.object({
  body: z.object({
    orderType: z.nativeEnum(OrderType).default(OrderType.PICKUP),
    tableNumber: z.string().optional(),
    pickupTime: z.string().datetime().optional(),
    note: z.string().max(500).optional(),
    offerCode: z.string().optional(),
    items: z
      .array(
        z.object({
          menuItemId: z.string().uuid(),
          quantity: z.number().int().min(1, 'Quantity must be at least 1').max(20),
        })
      )
      .min(1, 'Order must contain at least one item'),
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
    code: z.string().min(3).toUpperCase(),
    discountPercent: z.number().min(1).max(100),
    isBanner: z.boolean().default(true),
    imageUrl: z.string().url().optional(),
    // Both optional: omitting either means "never expires" / "unlimited uses",
    // matching the previous unconditional behaviour.
    expiresAt: z.string().datetime().optional(),
    maxRedemptions: z.number().int().positive().optional(),
  }),
});

export const updateOfferSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    discountPercent: z.number().min(1).max(100).optional(),
    isBanner: z.boolean().optional(),
    isActive: z.boolean().optional(),
    imageUrl: z.string().url().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    maxRedemptions: z.number().int().positive().nullable().optional(),
  }),
});
