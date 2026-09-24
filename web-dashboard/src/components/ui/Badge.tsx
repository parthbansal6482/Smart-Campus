import React from 'react';
import { cn } from '../../lib/utils';
import type { Tone } from '../../lib/status';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

const tones: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: 'bg-sunken text-ink-2', dot: 'bg-ink-4' },
  ok: { badge: 'bg-ok-soft text-ok', dot: 'bg-ok' },
  warn: { badge: 'bg-warn-soft text-warn', dot: 'bg-warn' },
  critical: { badge: 'bg-critical-soft text-critical', dot: 'bg-critical' },
  info: { badge: 'bg-info-soft text-info', dot: 'bg-info' },
};

export const Badge: React.FC<BadgeProps> = ({ children, className, tone = 'neutral', dot = true, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 h-6 px-2 rounded-md text-xs font-medium whitespace-nowrap',
      tones[tone].badge,
      className
    )}
    {...props}
  >
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', tones[tone].dot)} />}
    {children}
  </span>
);
