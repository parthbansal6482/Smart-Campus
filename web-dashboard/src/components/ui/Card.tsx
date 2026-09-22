import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, interactive = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden',
          interactive && 'transition-all duration-150 hover:border-slate-300/90 hover:shadow-sm',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <div className={twMerge(clsx('px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3', className))} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => {
  return (
    <h3 className={twMerge(clsx('text-sm font-bold text-slate-900 tracking-tight', className))} {...props}>
      {children}
    </h3>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <div className={twMerge(clsx('p-5', className))} {...props}>
      {children}
    </div>
  );
};
