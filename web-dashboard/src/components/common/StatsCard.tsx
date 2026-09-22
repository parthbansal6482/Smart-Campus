import React from 'react';
import { Card } from '../ui/Card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  subtext?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-blue-600',
  subtext,
}) => {
  return (
    <Card interactive className="p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums tracking-tight">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconBgColor} ${iconColor} flex items-center justify-center shrink-0 border border-slate-100 shadow-2xs`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(change || subtext) && (
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          {change && (
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                isPositive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/80'
              }`}
            >
              {change}
            </span>
          )}
          <span className="text-[11px] text-slate-400">{subtext || 'vs typical campus load'}</span>
        </div>
      )}
    </Card>
  );
};
