import React, { useEffect, useState } from 'react';
import { ExternalLink, Navigation } from 'lucide-react';
import { EmergencyLocationPing } from '../../types';
import { medicalService } from '../../services/medical.service';
import { timeAgo } from '../../lib/utils';

const POLL_MS = 10_000;

/** Latest GPS fix shared by the reporter of an active incident, refreshed while it is on screen. */
export const EmergencyLiveLocation: React.FC<{ emergencyId: string }> = ({ emergencyId }) => {
  const [latest, setLatest] = useState<EmergencyLocationPing | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const trail = await medicalService.getEmergencyLocationTrail(emergencyId);
        if (!cancelled) setLatest(trail[trail.length - 1] ?? null);
      } catch {
        /* keep the last known fix */
      }
    };
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [emergencyId]);

  if (!latest) return null;

  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg bg-canvas/60 border border-line px-3 py-2 text-[13px]">
      <Navigation className="w-3.5 h-3.5 text-ink-3" />
      <span className="text-ink-2">
        Live location · {timeAgo(latest.recordedAt)}
        {latest.accuracyM != null && ` · ±${Math.round(latest.accuracyM)} m`}
      </span>
      <a
        href={`https://www.google.com/maps?q=${latest.latitude},${latest.longitude}`}
        target="_blank"
        rel="noreferrer"
        className="ml-auto underline decoration-line-strong underline-offset-2 hover:decoration-ink inline-flex items-center gap-1"
      >
        Open map <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};
