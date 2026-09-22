import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ children, className, ...props }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className={twMerge(clsx('w-full text-left text-xs text-slate-700', className))} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => {
  return (
    <thead className={twMerge(clsx('bg-slate-50/90 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200/80', className))} {...props}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => {
  return (
    <tbody className={twMerge(clsx('divide-y divide-slate-100 bg-white', className))} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className, ...props }) => {
  return (
    <tr className={twMerge(clsx('hover:bg-slate-50/80 transition-colors', className))} {...props}>
      {children}
    </tr>
  );
};

export const TableHeaderCell: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => {
  return (
    <th className={twMerge(clsx('px-5 py-3', className))} {...props}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => {
  return (
    <td className={twMerge(clsx('px-5 py-3.5 whitespace-nowrap text-xs text-slate-800', className))} {...props}>
      {children}
    </td>
  );
};
