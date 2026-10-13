import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { PageHeader, Skeleton } from '../components/ui/Feedback';
import { toast } from '../components/ui/Toast';
import { useAuthStore } from '../store/authStore';
import { settingsService } from '../services/settings.service';
import { REALTIME_EVENTS } from '../services/socket';
import { CampusSettings, Role } from '../types';
import { roleLabel } from '../lib/status';
import { getErrorMessage } from '../lib/utils';

type Draft = { [K in keyof CampusSettings]: string };

// Which roles may change which setting. Mirrors the server, which is what actually enforces it.
const editableBy: Record<keyof CampusSettings, Role[]> = {
  securityPhone: ['ADMIN'],
  medicalCenterPhone: ['ADMIN', 'MEDICAL_STAFF'],
  medicalCenterLocation: ['ADMIN', 'MEDICAL_STAFF'],
  cafeteriaOpensAt: ['ADMIN', 'CAFETERIA_STAFF'],
  cafeteriaClosesAt: ['ADMIN', 'CAFETERIA_STAFF'],
  buildingMatchRadiusMeters: ['ADMIN'],
  maxBookingDaysAhead: ['ADMIN'],
};

const toDraft = (s: CampusSettings): Draft => ({
  securityPhone: s.securityPhone,
  medicalCenterPhone: s.medicalCenterPhone,
  medicalCenterLocation: s.medicalCenterLocation,
  cafeteriaOpensAt: s.cafeteriaOpensAt,
  cafeteriaClosesAt: s.cafeteriaClosesAt,
  buildingMatchRadiusMeters: String(s.buildingMatchRadiusMeters),
  maxBookingDaysAhead: String(s.maxBookingDaysAhead),
});

const NUMERIC: (keyof CampusSettings)[] = ['buildingMatchRadiusMeters', 'maxBookingDaysAhead'];

export const SettingsPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [saved, setSaved] = useState<CampusSettings | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const canEdit = (key: keyof CampusSettings) => !!user && editableBy[key].includes(user.role);

  const load = useCallback(async () => {
    try {
      const settings = await settingsService.get();
      setSaved(settings);
      // Pull in changes made elsewhere, but never overwrite what someone is in the middle of typing.
      setDraft(prev => {
        if (!prev) return toDraft(settings);
        const fresh = toDraft(settings);
        const next = { ...fresh };
        (Object.keys(prev) as (keyof CampusSettings)[]).forEach(k => {
          const wasUntouched = saved ? prev[k] === toDraft(saved)[k] : true;
          if (!wasUntouched) next[k] = prev[k];
        });
        return next;
      });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Couldn’t load settings.'));
    }
    // `saved` is read only to detect untouched fields; reloading on its change would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(REALTIME_EVENTS.settingsChanged, load);
    return () => window.removeEventListener(REALTIME_EVENTS.settingsChanged, load);
  }, [load]);

  const set = (key: keyof CampusSettings, value: string) => setDraft(prev => (prev ? { ...prev, [key]: value } : prev));

  const changedKeys =
    saved && draft ? (Object.keys(draft) as (keyof CampusSettings)[]).filter(k => canEdit(k) && draft[k] !== toDraft(saved)[k]) : [];

  const save = async () => {
    if (!draft || changedKeys.length === 0) return;
    const patch: Record<string, string | number> = {};
    for (const key of changedKeys) patch[key] = NUMERIC.includes(key) ? Number(draft[key]) : draft[key].trim();
    setSaving(true);
    try {
      const updated = await settingsService.update(patch);
      setSaved(updated);
      setDraft(toDraft(updated));
      toast.success('Settings saved — everyone sees the change straight away');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Couldn’t save the settings.'));
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof CampusSettings, label: string, extra: Partial<React.ComponentProps<typeof Input>> = {}) => (
    <Input
      label={label}
      value={draft?.[key] ?? ''}
      onChange={e => set(key, e.target.value)}
      disabled={!canEdit(key)}
      {...extra}
    />
  );

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Administration" title="Settings" description="Your account and campus-wide preferences." />

      <div className="space-y-6">
        <Card>
          <CardHeader title="Your account" description="Contact an administrator to change these details." />
          <CardBody className="grid sm:grid-cols-2 gap-4">
            <Input label="Name" value={user?.name ?? ''} disabled readOnly />
            <Input label="Email" value={user?.email ?? ''} disabled readOnly />
            <Input label="Phone" value={user?.phone ?? '—'} disabled readOnly />
            <Input label="Role" value={user ? roleLabel[user.role] : ''} disabled readOnly />
          </CardBody>
        </Card>

        {!draft ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <>
            <Card>
              <CardHeader title="Cafeteria hours" description="Orders (and pickup times) outside these hours are refused. Leave both empty for no limit." />
              <CardBody className="grid sm:grid-cols-2 gap-4">
                {field('cafeteriaOpensAt', 'Opens at', { type: 'time' })}
                {field('cafeteriaClosesAt', 'Closes at', { type: 'time' })}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Contacts" description="Shown in the app and used by the Call buttons." />
              <CardBody className="grid sm:grid-cols-2 gap-4">
                {field('securityPhone', 'Campus security hotline')}
                {field('medicalCenterPhone', 'Medical centre phone')}
                <div className="sm:col-span-2">{field('medicalCenterLocation', 'Medical centre location')}</div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Rooms and emergencies" />
              <CardBody className="grid sm:grid-cols-2 gap-4">
                {field('maxBookingDaysAhead', 'Book rooms up to (days ahead)', { type: 'number', min: 1, max: 365 })}
                {field('buildingMatchRadiusMeters', 'Building match radius for SOS (metres)', {
                  type: 'number',
                  min: 10,
                  max: 5000,
                  hint: 'How close an alert must be to a building to be attached to it.',
                })}
              </CardBody>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-ink-3">
                {changedKeys.length > 0 ? `${changedKeys.length} unsaved change${changedKeys.length === 1 ? '' : 's'}` : 'Fields you can’t edit are greyed out.'}
              </p>
              <Button onClick={save} isLoading={saving} disabled={changedKeys.length === 0}>
                Save changes
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
