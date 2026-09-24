import React from 'react';
import { Info } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Field';
import { PageHeader } from '../components/ui/Feedback';
import { useAuthStore } from '../store/authStore';
import { roleLabel } from '../lib/status';

export const SettingsPage: React.FC = () => {
  const user = useAuthStore(state => state.user);

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

        <div className="flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3.5">
          <Info className="w-4 h-4 text-ink-3 mt-0.5 shrink-0" />
          <p className="text-[13px] text-ink-2 leading-relaxed">
            The campus preferences below are a preview. They aren’t saved to the server yet, so changes here have no
            effect.
          </p>
        </div>

        <Card>
          <CardHeader title="Classroom automation" description="How rooms respond when they’re empty." />
          <CardBody className="grid sm:grid-cols-2 gap-4">
            <Input label="Switch off after (minutes idle)" type="number" defaultValue="15" disabled />
            <Input label="Target temperature (°C)" type="number" defaultValue="24" disabled />
            <Input label="Book up to (days ahead)" type="number" defaultValue="7" disabled />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Emergency dispatch" description="Used when routing SOS alerts." />
          <CardBody className="grid sm:grid-cols-2 gap-4">
            <Input label="Campus security hotline" defaultValue="+91 11 2659 1111" disabled />
            <Input label="Building match radius (metres)" type="number" defaultValue="50" disabled />
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
