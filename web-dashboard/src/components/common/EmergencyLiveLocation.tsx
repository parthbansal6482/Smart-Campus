import React, { useEffect, useState } from 'react';
import { ExternalLink, Navigation } from 'lucide-react';
import { EmergencyLocationPing } from '../../types';
import { medicalService } from '../../services/medical.service';
import { getSocket } from '../../services/socket';
import { timeAgo } from '../../lib/utils';

// Pings arrive over the socket; this slow poll only covers a missed message.
const POLL_MS = 30_000;

/** Latest GPS fix shared by the reporter of an active incident, refreshed while it is on screen. */
export const EmergencyLiveLocation: React.FC<{ emergencyId: string }> = ({ emergencyId }) => {
  const [trail, setTrail] = useState<EmergencyLocationPing[]>([]);
  const [latest, setLatest] = useState<EmergencyLocationPing | null>(null);
  // Re-render periodically so "2 min ago" keeps counting between pings.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 15_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const trail = await medicalService.getEmergencyLocationTrail(emergencyId);
        if (!cancelled) {
          setTrail(trail);
          setLatest(trail[trail.length - 1] ?? null);
        }
      } catch {
        /* keep the last known fix */
      }
    };
    load();
    const interval = setInterval(load, POLL_MS);

    // Join the incident's room to receive each GPS ping as it is recorded (and again after a reconnect).
    const socket = getSocket();
    const join = () => socket?.emit('emergency:join_incident', emergencyId);
    const onPing = (ping: EmergencyLocationPing) => {
      if (ping.emergencyId !== emergencyId) return;
      setTrail(prev => {
        const next = [...prev.filter(item => item.id !== ping.id), ping].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
        return next.slice(-200);
      });
      setLatest(prev => (!prev || ping.recordedAt >= prev.recordedAt ? ping : prev));
    };
    join();
    socket?.on('connect', join);
    socket?.on('emergency:reporter_location_updated', onPing);

    return () => {
      cancelled = true;
      clearInterval(interval);
      socket?.off('connect', join);
      socket?.off('emergency:reporter_location_updated', onPing);
    };
  }, [emergencyId]);

  if (!latest) return null;

  const points = trail.slice(-200);
  const longitudes = points.map(point => point.longitude);
  const latitudes = points.map(point => point.latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const longitudeSpan = Math.max(maxLongitude - minLongitude, 0.00001);
  const latitudeSpan = Math.max(maxLatitude - minLatitude, 0.00001);
  const project = (point: EmergencyLocationPing) => ({
    x: 16 + ((point.longitude - minLongitude) / longitudeSpan) * 288,
    y: 104 - ((point.latitude - minLatitude) / latitudeSpan) * 88,
  });
  const projected = points.map(project);
  const path = projected.map(point => `${point.x},${point.y}`).join(' ');
  const lastPoint = projected[projected.length - 1];

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-line bg-canvas/60">
      <div className="flex items-center gap-2 px-3 py-2 text-[13px]">
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
      <div className="border-t border-line px-3 py-2" aria-label={`Location trail with ${points.length} fixes`}>
        <div className="mb-1 flex items-center justify-between text-[11px] text-ink-3">
          <span>{points.length > 1 ? `Recent trail · ${points.length} fixes` : 'First location fix'}</span>
          {points.length > 1 && <span>oldest → newest</span>}
        </div>
        <svg viewBox="0 0 320 120" className="h-24 w-full rounded-md bg-surface" role="img" aria-hidden="true">
          <path d="M16 104H304M16 104V16" stroke="currentColor" className="text-line" strokeWidth="1" />
          {points.length > 1 && <polyline points={path} fill="none" stroke="currentColor" className="text-ink-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
          {projected.map((point, index) => (
            <circle
              key={`${points[index].id}-${index}`}
              cx={point.x}
              cy={point.y}
              r={index === projected.length - 1 ? 5 : 2.5}
              fill="currentColor"
              className={index === projected.length - 1 ? 'text-critical' : 'text-ink-3'}
            />
          ))}
          {lastPoint && <circle cx={lastPoint.x} cy={lastPoint.y} r="9" fill="none" stroke="currentColor" className="text-critical/30" strokeWidth="2" />}
        </svg>
      </div>
    </div>
  );
};
