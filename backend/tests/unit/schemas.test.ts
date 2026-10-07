import { describe, it, expect } from 'vitest';
import { createMenuItemSchema, updateMenuItemSchema } from '../../src/modules/cafeteria/cafeteria.schema';
import { emergencyLocationPingSchema } from '../../src/modules/medical-help/medical.schema';

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
