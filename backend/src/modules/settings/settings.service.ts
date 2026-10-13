import { prisma } from '../../config/db';
import { Role } from '@prisma/client';
import { ForbiddenError, BadRequestError } from '../../utils/errors';
import { recordAudit } from '../../utils/audit';
import { publishChange } from '../../sockets/liveSync';
import { SETTING_DEFINITIONS, SETTING_KEYS, SettingKey, Settings, canEditSetting } from './settings.definitions';

const TTL_MS = 15_000;
let cache: { value: Settings; at: number } | null = null;

const defaults = (): Settings =>
  Object.fromEntries(SETTING_KEYS.map(k => [k, SETTING_DEFINITIONS[k].default])) as unknown as Settings;

export class SettingsService {
  /** Stored values layered over the defaults. Cached briefly because order and booking paths read it. */
  async getAll(): Promise<Settings> {
    if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

    const rows = await prisma.campusSetting.findMany();
    const merged = defaults();
    for (const row of rows) {
      const key = row.key as SettingKey;
      const definition = SETTING_DEFINITIONS[key];
      if (!definition) continue; // a setting that no longer exists
      const parsed = definition.schema.safeParse(row.value);
      if (parsed.success) (merged as Record<string, unknown>)[key] = parsed.data;
    }
    cache = { value: merged, at: Date.now() };
    return merged;
  }

  async update(patch: Partial<Settings>, actor: { userId: string; role: Role }) {
    const keys = (Object.keys(patch) as SettingKey[]).filter(k => patch[k] !== undefined);
    const forbidden = keys.filter(k => !canEditSetting(k, actor.role));
    if (forbidden.length > 0) {
      throw new ForbiddenError(`You can't change: ${forbidden.join(', ')}`);
    }

    // Opening hours only make sense as a pair; check the combined result, not just the patch.
    const current = await this.getAll();
    const next = { ...current, ...patch };
    if (!!next.cafeteriaOpensAt !== !!next.cafeteriaClosesAt) {
      throw new BadRequestError('Set both the opening and closing time, or clear both');
    }
    if (next.cafeteriaOpensAt && next.cafeteriaOpensAt >= next.cafeteriaClosesAt) {
      throw new BadRequestError('Opening time must be before closing time');
    }

    await prisma.$transaction(
      keys.map(key =>
        prisma.campusSetting.upsert({
          where: { key },
          create: { key, value: patch[key] as never, updatedById: actor.userId },
          update: { value: patch[key] as never, updatedById: actor.userId },
        })
      )
    );
    cache = null;

    await recordAudit({ actorId: actor.userId, action: 'settings.update', targetType: 'Settings', targetId: 'campus', metadata: patch });
    publishChange('settings', { all: true }, 'updated', keys);
    return this.getAll();
  }
}

export const settingsService = new SettingsService();
