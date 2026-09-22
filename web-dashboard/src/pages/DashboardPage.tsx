import React, { useEffect, useState } from 'react';
import { StatsCard } from '../components/common/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  GraduationCap,
  AlertTriangle,
  UtensilsCrossed,
  Users,
  Activity,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  RefreshCw,
  MapPin,
  Sparkles,
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
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsData, emergenciesData, ordersData] = await Promise.allSettled([
        classroomService.getRooms(),
        emergencyService.getActive(),
        cafeteriaService.getOrders(true),
      ]);

      if (roomsData.status === 'fulfilled') setRooms(roomsData.value);
      if (emergenciesData.status === 'fulfilled') setEmergencies(emergenciesData.value);
      if (ordersData.status === 'fulfilled') setOrders(ordersData.value);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const occupiedRoomsCount = rooms.filter(r => r.isOccupied).length;
  const activeEmergenciesCount = emergencies.filter(e => e.status !== 'HANDLED').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'PLACED' || o.status === 'PREPARING').length;

  return (
    <div className="space-y-6">
      {/* Executive Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campus Operations Engine</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Cross-Module Command Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry across Emergency Medical Dispatch, Smart Classrooms, and Dining Services.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            isLoading={loading}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh Data
          </Button>
          <Link to="/medical-help">
            <Button variant="danger" size="sm" className="text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Dispatch Emergency
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Emergencies"
          value={loading ? '...' : activeEmergenciesCount}
          icon={AlertTriangle}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
          change={activeEmergenciesCount > 0 ? `${activeEmergenciesCount} active alert(s)` : 'All Clear'}
          isPositive={activeEmergenciesCount === 0}
          subtext="Immediate responder priority"
        />

        <StatsCard
          title="Classroom Utilization"
          value={loading ? '...' : `${occupiedRoomsCount} / ${rooms.length || 3}`}
          icon={GraduationCap}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          change={rooms.length > 0 ? `${Math.round((occupiedRoomsCount / rooms.length) * 100)}% occupied` : 'Idle'}
          isPositive={true}
          subtext="Automated HVAC & AV linked"
        />

        <StatsCard
          title="Kitchen Live Queue"
          value={loading ? '...' : pendingOrdersCount}
          icon={UtensilsCrossed}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          change={pendingOrdersCount > 0 ? `${pendingOrdersCount} in preparation` : 'Kitchen standby'}
          isPositive={true}
          subtext="Orders awaiting pickup"
        />

        <StatsCard
          title="Registered Campus Users"
          value="1,420"
          icon={Users}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          change="+18 this week"
          isPositive={true}
          subtext="Students, Faculty, Staff"
        />
      </div>

      {/* Primary Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Emergency & Health Dispatch Board */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <div>
                <CardTitle>Live Incident Alerts & Medical Dispatch</CardTitle>
                <p className="text-[11px] text-slate-400">High-priority student and faculty SOS triggers</p>
              </div>
            </div>
            <Link
              to="/medical-help"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
            >
              <span>Manage Dispatch Board</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {emergencies.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 border border-emerald-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">Campus Grounds Secure</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No active medical incidents or SOS dispatches reported. Response teams are on regular patrol.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencies.map(e => (
                  <div
                    key={e.id}
                    className="p-4 rounded-xl border border-rose-200/90 bg-rose-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="danger" dot>
                          {e.status}
                        </Badge>
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          {e.building?.name || 'Campus Academic Quad'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 mt-1.5">
                        {e.description || 'Medical Assistance requested immediately'}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Reported by: <strong className="text-slate-600">{e.user?.name || 'Campus Student'}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(e.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <Link to="/medical-help">
                      <Button variant="danger" size="sm" className="w-full sm:w-auto text-xs shrink-0">
                        Acknowledge & Route
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Classroom Vacancy & Facility Monitor */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Classroom Facility Status</CardTitle>
              <p className="text-[11px] text-slate-400">Live IoT occupancy & climate</p>
            </div>
            <Link to="/classroom" className="text-xs text-blue-600 font-semibold hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {(rooms.length > 0
                ? rooms.slice(0, 4)
                : [
                    { id: '1', roomNumber: 'ENG-101', isOccupied: false, capacity: 60, hasAC: true },
                    { id: '2', roomNumber: 'ENG-204', isOccupied: true, capacity: 35, hasAC: true },
                    { id: '3', roomNumber: 'SCI-LabA', isOccupied: false, capacity: 25, hasAC: true },
                  ]
              ).map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{r.roomNumber}</p>
                    <p className="text-[11px] text-slate-400">
                      {r.capacity} Seats • {r.hasAC ? 'AC Active (70°F)' : 'Climate Eco'}
                    </p>
                  </div>
                  <Badge variant={r.isOccupied ? 'warning' : 'success'} dot>
                    {r.isOccupied ? 'Occupied' : 'Vacant'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dining & Cafeteria Real-Time Orders Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Kitchen Order Queue & Food Prep</CardTitle>
              <p className="text-[11px] text-slate-400">Active dining tokens in cafeteria fulfillment pipeline</p>
            </div>
            <Link to="/cafeteria">
              <Button variant="outline" size="sm" className="text-xs">
                Open Kitchen Board →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No orders currently in the kitchen preparation pipeline.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {orders.slice(0, 4).map(o => (
                <div
                  key={o.id}
                  className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80">
                      {o.orderToken}
                    </span>
                    <Badge variant={o.status === 'READY' ? 'success' : o.status === 'PREPARING' ? 'info' : 'warning'}>
                      {o.status}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-800">
                      {o.orderItems?.[0]?.menuItem?.name || 'Meal Combo'}
                      {o.orderItems && o.orderItems.length > 1 ? ` +${o.orderItems.length - 1} more` : ''}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Total: \${o.totalAmount.toFixed(2)} • {o.orderType}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
