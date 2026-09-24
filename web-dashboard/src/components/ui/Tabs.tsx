import React from 'react';
import { cn } from '../../lib/utils';

interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Underlined section tabs — used for switching between page sections. */
export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn('flex items-center gap-6 border-b border-line', className)}>
      {items.map(item => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative -mb-px flex items-center gap-2 h-10 text-sm transition-colors border-b-2',
              active ? 'text-ink font-medium border-ink' : 'text-ink-3 border-transparent hover:text-ink'
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'min-w-[20px] h-5 px-1.5 rounded-md text-xs tabular inline-flex items-center justify-center',
                  active ? 'bg-ink text-white' : 'bg-sunken text-ink-3'
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Compact pill filter — used for filtering a list in place. */
export function Segmented<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div className={cn('inline-flex items-center p-0.5 rounded-lg bg-sunken border border-line', className)}>
      {items.map(item => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            aria-pressed={active}
            className={cn(
              'h-7 px-3 rounded-md text-[13px] transition-colors whitespace-nowrap',
              active ? 'bg-surface text-ink font-medium border border-line shadow-[0_1px_1px_rgba(26,25,23,0.04)]' : 'text-ink-3 hover:text-ink'
            )}
          >
            {item.label}
            {item.count !== undefined && <span className="ml-1.5 text-ink-4 tabular">{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
