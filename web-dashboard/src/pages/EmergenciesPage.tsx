import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { emergencyService } from '../services/emergency.service';
import { Emergency, EmergencyStatus } from '../types';
import { AlertCircle, Phone, MapPin, CheckCircle, ShieldAlert } from 'lucide-react';

export const EmergenciesPage: React.FC = () => {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmergencies = async () => {
    try {
      const data = await emergencyService.getAll();
      setEmergencies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmergencies();
  }, []);

  const handleStatusChange = async (id: string, status: EmergencyStatus) => {
    try {
      const updated = await emergencyService.updateStatus(id, status);
      setEmergencies(prev => prev.map(e => (e.id === id ? updated : e)));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const getStatusBadgeVariant = (status: EmergencyStatus) => {
    switch (status) {
      case 'REPORTED':
        return 'danger';
      case 'DISPATCHED':
        return 'warning';
      case 'IN_PROGRESS':
        return 'info';
      case 'RESOLVED':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Emergency & Health Assistance Dispatch</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time incident feed, victim geolocation, and responder unit dispatching
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadEmergencies}>
          Refresh Incidents
        </Button>
      </div>

      {/* Incident Log Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <CardTitle>Campus Incident Log</CardTitle>
          </div>
        </CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Incident Status</TableHeaderCell>
              <TableHeaderCell>Caller / Victim</TableHeaderCell>
              <TableHeaderCell>Location & Building</TableHeaderCell>
              <TableHeaderCell>Details</TableHeaderCell>
              <TableHeaderCell>Reported Time</TableHeaderCell>
              <TableHeaderCell className="text-right">Dispatch Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(emergencies.length > 0
              ? emergencies
              : [
                  {
                    id: 'e1',
                    userId: 'u1',
                    latitude: 37.7756,
                    longitude: -122.4184,
                    status: 'DISPATCHED' as EmergencyStatus,
                    description: 'Minor lab chemical burn, first-aid required in SCI-LabA',
                    reportedAt: new Date().toISOString(),
                    building: { name: 'Marie Curie Science Complex', code: 'SCI', id: 'b2', latitude: 0, longitude: 0, floorCount: 3 },
                    user: { name: 'Alex Johnson', email: 'student@smartcampus.edu', phone: '+1-555-0103', id: 'u1', role: 'STUDENT' as const, createdAt: '' },
                  },
                ]
            ).map(incident => (
              <TableRow key={incident.id}>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(incident.status)}>
                    {incident.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-semibold text-slate-900">{incident.user?.name || 'Campus Member'}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {incident.user?.phone || 'No phone recorded'}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-slate-900">
                        {incident.building?.name || 'Open Campus Area'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate text-xs text-slate-600">
                  {incident.description || 'Emergency one-tap alert triggered'}
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {new Date(incident.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell className="text-right space-x-1.5">
                  {incident.status === 'REPORTED' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStatusChange(incident.id, 'DISPATCHED')}
                    >
                      Dispatch Team
                    </Button>
                  )}
                  {incident.status === 'DISPATCHED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(incident.id, 'IN_PROGRESS')}
                    >
                      Mark On Scene
                    </Button>
                  )}
                  {(incident.status === 'IN_PROGRESS' || incident.status === 'DISPATCHED') && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                      onClick={() => handleStatusChange(incident.id, 'RESOLVED')}
                    >
                      Resolve Incident
                    </Button>
                  )}
                  {incident.status === 'RESOLVED' && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Resolved
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
