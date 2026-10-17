import { z } from 'zod';
import { MenuCategory, OrderStatus, OrderType } from '@prisma/client';

const nutritionFields = {
  // Portions left today; leave out to not track stock. Update may send null to stop tracking.
  stock: z.number().int().min(0).max(10_000).optional(),
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

// On update, null clears a previously stored value (omitting a field leaves it unchanged).
const clearable = {
  stock: nutritionFields.stock.nullable(),
  servingSize: nutritionFields.servingSize.nullable(),
  calories: nutritionFields.calories.nullable(),
  proteinG: nutritionFields.proteinG.nullable(),
  carbsG: nutritionFields.carbsG.nullable(),
  fatG: nutritionFields.fatG.nullable(),
  fiberG: nutritionFields.fiberG.nullable(),
  sugarG: nutritionFields.sugarG.nullable(),
  sodiumMg: nutritionFields.sodiumMg.nullable(),
};

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
    // false restores a dish that was removed from the menu.
    isArchived: z.boolean().optional(),
    imageUrl: z.string().url().optional(),
    ...nutritionFields,
    ...clearable,
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

const csv = z
  .string()
  .transform(v => v.split(',').map(x => x.trim().toLowerCase()).filter(Boolean))
  .optional();

const queryBool = z.enum(['true', 'false']).transform(v => v === 'true').optional();

export const MENU_SORTS = ['name', 'price_asc', 'price_desc', 'rating', 'popular', 'calories'] as const;

// Parsed straight from req.query in the controller (validate() only rewrites the body).
export const menuQuerySchema = z.object({
  category: z.nativeEnum(MenuCategory).optional(),
  isVeg: queryBool,
  search: z.string().trim().max(80).optional(),
  sort: z.enum(MENU_SORTS).default('name'),
  maxCalories: z.coerce.number().int().min(0).max(5000).optional(),
  // Comma-separated allergens to leave out, e.g. "dairy,nuts".
  excludeAllergens: csv,
  inStockOnly: queryBool,
  // Staff only (ignored for everyone else): include dishes that were removed from the menu.
  includeArchived: queryBool,
});

export const orderListQuerySchema = z
  .object({
    status: z.nativeEnum(OrderStatus).optional(),
    all: queryBool,
    // true = only orders still in the kitchen pipeline, false = only finished ones (collected/cancelled); overrides `status`.
    active: queryBool,
    // Token (#ORD-0007 or just 7) or, for staff, the customer's name.
    search: z.string().trim().max(60).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .refine(q => !q.from || !q.to || q.from <= q.to, { message: '`from` must not be after `to`', path: ['from'] });

export const upsertReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(500).optional(),
  }),
});

export const reviewListQuerySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
});
