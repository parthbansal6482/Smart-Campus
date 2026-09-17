import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Campus System Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure real-time threshold parameters, facility automation timers, and notification webhooks
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classroom Automation Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Auto-Off Idle Timer (minutes)"
            type="number"
            defaultValue="15"
            helperText="Turn off HVAC and lights automatically after room becomes vacant"
          />
          <Input
            label="Booking Lead Time Window (days in advance)"
            type="number"
            defaultValue="7"
            helperText="Maximum advance booking horizon for students and faculty"
          />
          <Button size="sm">Save Automation Rules</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Dispatch Broadcast</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Campus Security Hotline Number"
            type="text"
            defaultValue="+1-555-0911"
          />
          <Input
            label="Proximity Threshold for Auto-Building Tagging (meters)"
            type="number"
            defaultValue="50"
            helperText="Radius around building GPS coordinates used for incident auto-association"
          />
          <Button size="sm">Update Dispatch Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
};
