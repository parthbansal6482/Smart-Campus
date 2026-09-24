import React from 'react';
import { EmergencyStatus } from '../../types';
import { emergencyFlow, emergencyLabel } from '../../lib/status';
import { cn } from '../../lib/utils';

/** Five-step response progress: Reported → Assigned → On the way → Arrived → Handled. */
export const EmergencyProgress: React.FC<{ status: EmergencyStatus; compact?: boolean }> = ({ status, compact }) => {
  const current = emergencyFlow.indexOf(status);

  return (
    <div>
      <div className="flex items-center gap-1" aria-label={`Status: ${emergencyLabel[status]}`}>
        {emergencyFlow.map((step, i) => (
          <span
            key={step}
            className={cn(
              'h-1 flex-1 rounded-full',
              i <= current ? (current === 0 ? 'bg-critical' : i === emergencyFlow.length - 1 ? 'bg-ok' : 'bg-ink') : 'bg-line'
            )}
          />
        ))}
      </div>
      {!compact && (
        <div className="hidden sm:flex justify-between mt-2 text-[11px] text-ink-4">
          {emergencyFlow.map((step, i) => (
            <span key={step} className={cn(i === current && 'text-ink font-medium')}>
              {emergencyLabel[step]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
