import React from 'react';
import { cn } from '../../lib/utils';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('bg-surface border border-line rounded-xl', className)} {...props}>
    {children}
  </div>
);

interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, description, action, className, ...props }) => (
  <div className={cn('flex items-start justify-between gap-4 px-5 pt-5 pb-4', className)} {...props}>
    <div className="min-w-0">
      <h3 className="text-[15px] font-semibold text-ink leading-6">{title}</h3>
      {description && <p className="text-[13px] text-ink-3 mt-0.5">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('px-5 pb-5', className)} {...props}>
    {children}
  </div>
);
