import React from 'react';
import { cn } from '../../lib/utils';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ children, className, ...props }) => (
  <div className="w-full overflow-x-auto">
    <table className={cn('w-full text-left text-[13px]', className)} {...props}>
      {children}
    </table>
  </div>
);

export const THead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <thead className={cn('border-y border-line bg-canvas/60', className)} {...props}>
    {children}
  </thead>
);

export const TBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => (
  <tbody className={cn('divide-y divide-line', className)} {...props}>
    {children}
  </tbody>
);

export const TR: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className, ...props }) => (
  <tr className={cn('transition-colors hover:bg-canvas/70', className)} {...props}>
    {children}
  </tr>
);

export const TH: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <th className={cn('px-5 h-10 text-xs font-medium text-ink-3 whitespace-nowrap', className)} {...props}>
    {children}
  </th>
);

export const TD: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => (
  <td className={cn('px-5 py-3.5 text-ink-2 align-middle', className)} {...props}>
    {children}
  </td>
);
