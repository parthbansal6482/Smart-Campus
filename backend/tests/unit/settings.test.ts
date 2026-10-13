import { describe, it, expect } from 'vitest';
import { Role } from '@prisma/client';
import { canEditSetting, updateSettingsSchema } from '../../src/modules/settings/settings.definitions';

const parse = (body: unknown) => updateSettingsSchema.safeParse({ body });

describe('updateSettingsSchema', () => {
  it('accepts any subset of known settings', () => {
    expect(parse({ securityPhone: '+91 11 2659 1111' }).success).toBe(true);
    expect(parse({ cafeteriaOpensAt: '08:00', cafeteriaClosesAt: '21:00', maxBookingDaysAhead: 14 }).success).toBe(true);
  });

  it('rejects an empty change, unknown keys and bad values', () => {
    expect(parse({}).success).toBe(false);
    expect(parse({ favouriteColour: 'blue' }).success).toBe(false);
    expect(parse({ cafeteriaOpensAt: '8am' }).success).toBe(false);
    expect(parse({ maxBookingDaysAhead: 0 }).success).toBe(false);
    expect(parse({ buildingMatchRadiusMeters: 5 }).success).toBe(false);
  });

  it('rejects opening hours that end before they start, but allows clearing them', () => {
    expect(parse({ cafeteriaOpensAt: '21:00', cafeteriaClosesAt: '08:00' }).success).toBe(false);
    expect(parse({ cafeteriaOpensAt: '', cafeteriaClosesAt: '' }).success).toBe(true);
  });
});

describe('canEditSetting', () => {
  it('lets each team manage its own settings and admins manage everything', () => {
    expect(canEditSetting('cafeteriaOpensAt', Role.CAFETERIA_STAFF)).toBe(true);
    expect(canEditSetting('medicalCenterPhone', Role.MEDICAL_STAFF)).toBe(true);
    expect(canEditSetting('securityPhone', Role.ADMIN)).toBe(true);
  });

  it('keeps campus-wide settings away from other roles', () => {
    expect(canEditSetting('securityPhone', Role.CAFETERIA_STAFF)).toBe(false);
    expect(canEditSetting('cafeteriaClosesAt', Role.MEDICAL_STAFF)).toBe(false);
    expect(canEditSetting('buildingMatchRadiusMeters', Role.FACULTY)).toBe(false);
  });
});
