import { describe, it, expect } from 'vitest';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  menuQuerySchema,
  orderListQuerySchema,
  upsertReviewSchema,
} from '../../src/modules/cafeteria/cafeteria.schema';
import { emergencyLocationPingSchema, locationTrailQuerySchema } from '../../src/modules/medical-help/medical.schema';

describe('createMenuItemSchema nutrition fields', () => {
  const base = { name: 'Rajma rice', price: 80 };

  it('accepts a full set of nutrition facts', () => {
    const r = createMenuItemSchema.safeParse({
      body: { ...base, calories: 420, proteinG: 14.5, ingredients: ['rice', 'rajma'], allergens: ['dairy'], galleryUrls: ['https://x.test/a.jpg'] },
    });
    expect(r.success).toBe(true);
  });

  it('accepts an item with no nutrition facts', () => {
    expect(createMenuItemSchema.safeParse({ body: base }).success).toBe(true);
  });

  it('rejects negative or fractional calories', () => {
    expect(createMenuItemSchema.safeParse({ body: { ...base, calories: -1 } }).success).toBe(false);
    expect(createMenuItemSchema.safeParse({ body: { ...base, calories: 10.5 } }).success).toBe(false);
  });

  it('rejects non-URL gallery entries and blank ingredients', () => {
    expect(createMenuItemSchema.safeParse({ body: { ...base, galleryUrls: ['not-a-url'] } }).success).toBe(false);
    expect(createMenuItemSchema.safeParse({ body: { ...base, ingredients: ['  '] } }).success).toBe(false);
  });
});

describe('updateMenuItemSchema nutrition fields', () => {
  it('lets scalar nutrition facts be cleared with null', () => {
    const r = updateMenuItemSchema.safeParse({ body: { calories: null, proteinG: null, servingSize: null } });
    expect(r.success).toBe(true);
  });

  it('still rejects out-of-range values and null arrays', () => {
    expect(updateMenuItemSchema.safeParse({ body: { calories: 9999 } }).success).toBe(false);
    expect(updateMenuItemSchema.safeParse({ body: { allergens: null } }).success).toBe(false);
  });
});

describe('emergencyLocationPingSchema', () => {
  it('accepts a valid fix', () => {
    expect(emergencyLocationPingSchema.safeParse({ body: { latitude: 12.9, longitude: 77.6, accuracyM: 8 } }).success).toBe(true);
  });

  it('rejects out-of-range coordinates', () => {
    expect(emergencyLocationPingSchema.safeParse({ body: { latitude: 91, longitude: 0 } }).success).toBe(false);
    expect(emergencyLocationPingSchema.safeParse({ body: { latitude: 0, longitude: -181 } }).success).toBe(false);
  });
});

describe('locationTrailQuerySchema', () => {
  it('accepts no limit or a sensible one', () => {
    expect(locationTrailQuerySchema.safeParse({ query: {} }).success).toBe(true);
    expect(locationTrailQuerySchema.safeParse({ query: { limit: '50' } }).success).toBe(true);
  });

  it('rejects zero, huge or non-numeric limits', () => {
    for (const limit of ['0', '501', 'abc', '1.5']) {
      expect(locationTrailQuerySchema.safeParse({ query: { limit } }).success).toBe(false);
    }
  });
});

describe('menuQuerySchema', () => {
  it('defaults the sort and parses filters', () => {
    const r = menuQuerySchema.parse({ isVeg: 'true', maxCalories: '400', excludeAllergens: 'Dairy, nuts ,' });
    expect(r.sort).toBe('name');
    expect(r.isVeg).toBe(true);
    expect(r.maxCalories).toBe(400);
    expect(r.excludeAllergens).toEqual(['dairy', 'nuts']);
  });

  it('rejects an unknown sort and a bad boolean', () => {
    expect(menuQuerySchema.safeParse({ sort: 'cheapest' }).success).toBe(false);
    expect(menuQuerySchema.safeParse({ isVeg: 'yes' }).success).toBe(false);
  });
});

describe('orderListQuerySchema', () => {
  it('rejects an inverted date range', () => {
    const r = orderListQuerySchema.safeParse({ from: '2026-10-12T00:00:00Z', to: '2026-10-01T00:00:00Z' });
    expect(r.success).toBe(false);
  });

  it('accepts status, search and a valid range', () => {
    const r = orderListQuerySchema.safeParse({ status: 'READY', search: '#ORD-0007', from: '2026-10-01T00:00:00Z', to: '2026-10-12T00:00:00Z' });
    expect(r.success).toBe(true);
  });
});

describe('upsertReviewSchema', () => {
  it('requires a 1-5 whole-number rating', () => {
    expect(upsertReviewSchema.safeParse({ body: { rating: 5, comment: 'Great' } }).success).toBe(true);
    for (const rating of [0, 6, 3.5]) expect(upsertReviewSchema.safeParse({ body: { rating } }).success).toBe(false);
  });
});

describe('menu stock', () => {
  it('can be set on create, cleared with null on update, but not negative', () => {
    expect(createMenuItemSchema.safeParse({ body: { name: 'Samosa', price: 20, stock: 40 } }).success).toBe(true);
    expect(updateMenuItemSchema.safeParse({ body: { stock: null } }).success).toBe(true);
    expect(updateMenuItemSchema.safeParse({ body: { stock: -1 } }).success).toBe(false);
  });
});
