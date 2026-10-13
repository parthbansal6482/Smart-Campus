import { z } from 'zod';
import { Role } from '@prisma/client';
import { env } from '../../config/env';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM (24-hour)');

/**
 * Every runtime setting: its type, its default, and which roles may change it. Defaults fall back
 * to the environment where one exists, so existing deployments behave exactly as before until
 * someone changes a value.
 */
export const SETTING_DEFINITIONS = {
  securityPhone: { schema: z.string().trim().min(3).max(30), default: '+91 11 2659 1111', editableBy: [Role.ADMIN] },
  medicalCenterPhone: { schema: z.string().trim().min(3).max(30), default: '+91 11 2659 1234', editableBy: [Role.ADMIN, Role.MEDICAL_STAFF] },
  medicalCenterLocation: {
    schema: z.string().trim().min(2).max(120),
    default: 'Health Block, ground floor — next to the Student Centre',
    editableBy: [Role.ADMIN, Role.MEDICAL_STAFF],
  },
  // Empty string = no limit. Both must be set for opening hours to apply.
  cafeteriaOpensAt: { schema: hhmm.or(z.literal('')), default: env.CAFETERIA_OPENS_AT ?? '', editableBy: [Role.ADMIN, Role.CAFETERIA_STAFF] },
  cafeteriaClosesAt: { schema: hhmm.or(z.literal('')), default: env.CAFETERIA_CLOSES_AT ?? '', editableBy: [Role.ADMIN, Role.CAFETERIA_STAFF] },
  buildingMatchRadiusMeters: {
    schema: z.number().min(10).max(5000),
    default: env.BUILDING_MATCH_RADIUS_METERS,
    editableBy: [Role.ADMIN],
  },
  maxBookingDaysAhead: { schema: z.number().int().min(1).max(365), default: 30, editableBy: [Role.ADMIN] },
} as const;

export type SettingKey = keyof typeof SETTING_DEFINITIONS;
export type Settings = { [K in SettingKey]: z.infer<(typeof SETTING_DEFINITIONS)[K]['schema']> };

export const SETTING_KEYS = Object.keys(SETTING_DEFINITIONS) as SettingKey[];

/** Body of PUT /settings: any subset of the known settings, nothing else. */
export const updateSettingsSchema = z.object({
  body: z
    .object(Object.fromEntries(SETTING_KEYS.map(k => [k, SETTING_DEFINITIONS[k].schema.optional()])) as {
      [K in SettingKey]: z.ZodOptional<(typeof SETTING_DEFINITIONS)[K]['schema']>;
    })
    .strict()
    .refine(b => Object.keys(b).length > 0, { message: 'Provide at least one setting to change' })
    .refine(b => !b.cafeteriaOpensAt || !b.cafeteriaClosesAt || b.cafeteriaOpensAt < b.cafeteriaClosesAt, {
      message: 'Opening time must be before closing time',
      path: ['cafeteriaOpensAt'],
    }),
});

export const canEditSetting = (key: SettingKey, role: Role) => (SETTING_DEFINITIONS[key].editableBy as readonly Role[]).includes(role);
