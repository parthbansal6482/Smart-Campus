import React, { useEffect, useState } from 'react';
import { StatsCard } from '../components/common/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  GraduationCap,
  AlertTriangle,
  UtensilsCrossed,
  Users,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { classroomService } from '../services/classroom.service';
import { emergencyService } from '../services/emergency.service';
import { cafeteriaService } from '../services/cafeteria.service';
import { Emergency, Room, Order } from '../types';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsData, emergenciesData, ordersData] = await Promise.allSettled([
          classroomService.getRooms(),
          emergencyService.getActive(),
          cafeteriaService.getOrders(true),
        ]);

        if (roomsData.status === 'fulfilled') setRooms(roomsData.value);
        if (emergenciesData.status === 'fulfilled') setEmergencies(emergenciesData.value);
        if (ordersData.status === 'fulfilled') setOrders(ordersData.value);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const occupiedRoomsCount = rooms.filter(r => r.isOccupied).length;
  const activeEmergenciesCount = emergencies.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'PLACED' || o.status === 'PREPARING').length;

  return (
    <div className="space-y-8">
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Active Emergencies"
          value={loading ? '...' : activeEmergenciesCount}
          icon={AlertTriangle}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
          change={activeEmergenciesCount > 0 ? '+1 active' : 'All clear'}
          isPositive={activeEmergenciesCount === 0}
        />

        <StatsCard
          title="Classroom Occupancy"
          value={loading ? '...' : `${occupiedRoomsCount} / ${rooms.length || 3}`}
          icon={GraduationCap}
          iconBgColor="bg-campus-50"
          iconColor="text-campus-600"
          change="68% avg load"
          isPositive={true}
        />

        <StatsCard
          title="Live Cafeteria Orders"
          value={loading ? '...' : pendingOrdersCount}
          icon={UtensilsCrossed}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          change="Kitchen in rush"
          isPositive={true}
        />

        <StatsCard
          title="Campus Active Users"
          value="1,420"
          icon={Users}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          change="+12% today"
          isPositive={true}
        />
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Emergency & Incident Monitor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <CardTitle>Live Emergency Alerts & Health Dispatches</CardTitle>
            </div>
            <Link
              to="/emergencies"
              className="text-xs font-semibold text-campus-600 hover:text-campus-700 flex items-center gap-1"
            >
              View Dispatch Board <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {emergencies.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <Activity className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-800">No active campus emergencies</p>
                <p className="text-xs text-slate-400 mt-0.5">Campus responders are currently on standby</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencies.map(e => (
                  <div
                    key={e.id}
                    className="p-3.5 rounded-lg border border-rose-100 bg-rose-50/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="danger">{e.status}</Badge>
                        <span className="text-xs font-semibold text-slate-900">
                          {e.building?.name || 'Campus Grounds'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{e.description || 'Medical Assistance requested'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Reported by {e.user?.name} • {new Date(e.reportedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Link
                      to="/emergencies"
                      className="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 transition-colors shadow-xs"
                    >
                      Track Response
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Room Status Glance */}
        <Card>
          <CardHeader>
            <CardTitle>Classroom Real-Time Status</CardTitle>
            <Link to="/classrooms" className="text-xs text-campus-600 font-semibold hover:underline">
              Manage
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(rooms.length > 0
                ? rooms
                : [
                    { id: '1', roomNumber: 'ENG-101', isOccupied: false, capacity: 60, hasAC: true },
                    { id: '2', roomNumber: 'ENG-204', isOccupied: true, capacity: 35, hasAC: true },
                    { id: '3', roomNumber: 'SCI-LabA', isOccupied: false, capacity: 25, hasAC: true },
                  ]
              ).map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{r.roomNumber}</p>
                    <p className="text-[11px] text-slate-400">Capacity: {r.capacity} seats • AC On</p>
                  </div>
                  <Badge variant={r.isOccupied ? 'warning' : 'success'}>
                    {r.isOccupied ? 'Occupied' : 'Available'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
