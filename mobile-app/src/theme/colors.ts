/**
 * Warm paper neutrals with ink, shared with the web dashboard.
 * Semantic tones are used only to convey state — never as decoration.
 */
export const colors = {
  canvas: '#F7F6F3',
  surface: '#FFFFFF',
  sunken: '#F1EFEA',
  line: '#E7E4DD',
  lineStrong: '#D5D1C7',

  ink: '#1A1917',
  ink2: '#4A4741',
  ink3: '#6F6B62',
  ink4: '#A19D93',
  onInk: '#FFFFFF',

  critical: '#B42318',
  criticalPressed: '#9A1E14',
  criticalSoft: '#FBEEEC',
  criticalLine: '#F2CDC8',

  warn: '#8A5A0B',
  warnSoft: '#FAF3E3',

  ok: '#2E6A4F',
  okSoft: '#ECF3EE',

  info: '#2F4F7F',
  infoSoft: '#EEF2F7',

  scrim: 'rgba(26, 25, 23, 0.35)',
};

export type Tone = 'neutral' | 'ok' | 'warn' | 'critical' | 'info';

export const toneColors: Record<Tone, { fg: string; bg: string }> = {
  neutral: { fg: colors.ink2, bg: colors.sunken },
  ok: { fg: colors.ok, bg: colors.okSoft },
  warn: { fg: colors.warn, bg: colors.warnSoft },
  critical: { fg: colors.critical, bg: colors.criticalSoft },
  info: { fg: colors.info, bg: colors.infoSoft },
};
