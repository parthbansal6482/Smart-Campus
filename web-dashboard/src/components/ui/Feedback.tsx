import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn, initials } from '../../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center text-center py-14 px-6', className)}>
    {Icon && (
      <div className="w-10 h-10 rounded-full border border-line flex items-center justify-center text-ink-3 mb-4">
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
      </div>
    )}
    <p className="text-sm font-medium text-ink">{title}</p>
    {description && <p className="text-[13px] text-ink-3 mt-1 max-w-sm leading-relaxed">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('rounded-md bg-sunken animate-pulse', className)} />
);

export const SkeletonRows: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="px-5 pb-5 space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-full" />
    ))}
  </div>
);

export const Avatar: React.FC<{ name?: string; size?: 'sm' | 'md' }> = ({ name, size = 'md' }) => (
  <span
    className={cn(
      'inline-flex items-center justify-center rounded-full bg-sunken border border-line text-ink-2 font-medium shrink-0',
      size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-xs'
    )}
  >
    {initials(name)}
  </span>
);

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, actions }) => (
  <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
    <div className="min-w-0">
      {eyebrow && <p className="text-[13px] text-ink-3 mb-2">{eyebrow}</p>}
      <h1 className="font-serif text-title md:text-[38px] text-ink">{title}</h1>
      {description && <p className="text-sm text-ink-3 mt-2 max-w-2xl leading-relaxed">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </header>
);

interface StatProps {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: 'default' | 'critical';
}

export const Stat: React.FC<StatProps> = ({ label, value, detail, tone = 'default' }) => (
  <div className="px-5 py-5 min-w-0">
    <p className="text-[13px] text-ink-3">{label}</p>
    <p className={cn('font-serif text-display mt-2 tabular', tone === 'critical' ? 'text-critical' : 'text-ink')}>
      {value}
    </p>
    {detail && <p className="text-[13px] text-ink-3 mt-1.5 truncate">{detail}</p>}
  </div>
);

export const StatGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div
    className={cn(
      'grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-xl overflow-hidden [&>*]:bg-surface',
      className
    )}
  >
    {children}
  </div>
);
