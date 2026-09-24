import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, RefreshCw, ShieldCheck, UtensilsCrossed, DoorOpen } from 'lucide-react';
import { classroomService } from '../services/classroom.service';
import { medicalService } from '../services/medical.service';
import { cafeteriaService } from '../services/cafeteria.service';
import { usersService } from '../services/users.service';
import { Emergency, Room, Order, User } from '../types';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState, PageHeader, Skeleton, SkeletonRows, Stat, StatGroup } from '../components/ui/Feedback';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { EmergencyProgress } from '../components/common/EmergencyProgress';
import { emergencyLabel, emergencyTone, humanizeTag, orderLabel, orderTone } from '../lib/status';
import { formatCurrency, formatTime, greeting, humanize, timeAgo } from '../lib/utils';

const ACTIVE_ORDER_STATUSES: Order['status'][] = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'];

export const DashboardPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [people, setPeople] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    const [roomsRes, emergenciesRes, ordersRes, peopleRes] = await Promise.allSettled([
      classroomService.getRooms(),
      medicalService.getActiveEmergencies(),
      cafeteriaService.getOrders(true),
      usersService.getAll(),
    ]);
    if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value);
    if (emergenciesRes.status === 'fulfilled') setEmergencies(emergenciesRes.value);
    if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value);
    if (peopleRes.status === 'fulfilled') setPeople(peopleRes.value);
    setUpdatedAt(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const roomsInUse = rooms.filter(r => r.isOccupied).length;
  const activeOrders = orders.filter(o => ACTIVE_ORDER_STATUSES.includes(o.status));
  const readyOrders = activeOrders.filter(o => o.status === 'READY').length;
  const roleCount = new Set(people.map(p => p.role)).size;
  const firstName = user?.name?.split(' ')[0];

  const today = new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <PageHeader
        eyebrow={today}
        title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        description="Here’s what’s happening across the campus right now."
        actions={
          <>
            {updatedAt && <span className="text-xs text-ink-4 mr-1">Updated {formatTime(updatedAt.toISOString())}</span>}
            <Button variant="secondary" size="sm" onClick={fetchData} disabled={refreshing}>
              <RefreshCw className={refreshing ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
              Refresh
            </Button>
          </>
        }
      />

      {emergencies.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-critical-line bg-critical-soft px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-critical shrink-0" />
            <div>
              <p className="text-sm font-semibold text-critical">
                {emergencies.length} active {emergencies.length === 1 ? 'emergency' : 'emergencies'}
              </p>
              <p className="text-[13px] text-ink-2 mt-0.5">
                Latest at {emergencies[0].building?.name || 'an unidentified location'} · reported{' '}
                {timeAgo(emergencies[0].reportedAt)}
              </p>
            </div>
          </div>
          <Link to="/medical-help">
            <Button variant="danger" size="sm">
              Open dispatch <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-[140px] w-full rounded-xl" />
      ) : (
        <StatGroup>
          <Stat
            label="Active emergencies"
            value={emergencies.length}
            tone={emergencies.length > 0 ? 'critical' : 'default'}
            detail={emergencies.length > 0 ? 'Needs responder attention' : 'All clear'}
          />
          <Stat
            label="Rooms in use"
            value={
              <>
                {roomsInUse}
                <span className="text-ink-4 text-[28px]"> / {rooms.length}</span>
              </>
            }
            detail={`${rooms.length - roomsInUse} free right now`}
          />
          <Stat
            label="Kitchen queue"
            value={activeOrders.length}
            detail={readyOrders > 0 ? `${readyOrders} ready for pickup` : 'Nothing waiting at the counter'}
          />
          <Stat label="People" value={people.length} detail={`Across ${roleCount} roles`} />
        </StatGroup>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Emergencies"
            description="Open incidents, most recent first"
            action={
              <Link to="/medical-help" className="text-[13px] text-ink-2 hover:text-ink inline-flex items-center gap-1">
                Dispatch board <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          {loading ? (
            <SkeletonRows rows={2} />
          ) : emergencies.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No active emergencies"
              description="New SOS alerts from the mobile app will appear here."
            />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {emergencies.map(e => (
                <li key={e.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-ink-3 shrink-0" />
                        <span className="truncate">{e.building?.name || 'Location being resolved'}</span>
                      </p>
                      <p className="text-[13px] text-ink-3 mt-1">
                        {humanizeTag(e.tag)} · {e.user?.name || 'Unknown reporter'} · {timeAgo(e.reportedAt)}
                      </p>
                    </div>
                    <Badge tone={emergencyTone(e.status)}>{emergencyLabel[e.status]}</Badge>
                  </div>
                  <div className="mt-3.5">
                    <EmergencyProgress status={e.status} compact />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Rooms"
            description={`${rooms.length} tracked`}
            action={
              <Link to="/classroom" className="text-[13px] text-ink-2 hover:text-ink inline-flex items-center gap-1">
                All rooms <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          {loading ? (
            <SkeletonRows rows={3} />
          ) : rooms.length === 0 ? (
            <EmptyState icon={DoorOpen} title="No rooms yet" description="Rooms added by an administrator appear here." />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {rooms.slice(0, 6).map(room => (
                <li key={room.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{room.roomNumber}</p>
                    <p className="text-xs text-ink-3 truncate">
                      {room.building?.name} · {room.capacity} seats
                    </p>
                  </div>
                  <Badge tone={room.isOccupied ? 'warn' : 'ok'}>{room.isOccupied ? 'In use' : 'Free'}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Kitchen queue"
          description="Orders that haven’t been collected yet"
          action={
            <Link to="/cafeteria" className="text-[13px] text-ink-2 hover:text-ink inline-flex items-center gap-1">
              Kitchen board <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        {loading ? (
          <SkeletonRows rows={3} />
        ) : activeOrders.length === 0 ? (
          <EmptyState icon={UtensilsCrossed} title="The queue is clear" description="New orders from the app will show up here." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Order</TH>
                <TH>Customer</TH>
                <TH>Items</TH>
                <TH>Type</TH>
                <TH>Status</TH>
                <TH className="text-right">Total</TH>
              </tr>
            </THead>
            <TBody>
              {activeOrders.slice(0, 6).map(order => (
                <TR key={order.id}>
                  <TD className="font-mono text-ink">{order.orderToken}</TD>
                  <TD className="text-ink">{order.user?.name}</TD>
                  <TD className="max-w-[260px] truncate">
                    {order.orderItems?.map(i => `${i.quantity}× ${i.menuItem?.name}`).join(', ')}
                  </TD>
                  <TD>{humanize(order.orderType)}</TD>
                  <TD>
                    <Badge tone={orderTone(order.status)}>{orderLabel[order.status]}</Badge>
                  </TD>
                  <TD className="text-right text-ink tabular">{formatCurrency(order.totalAmount)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
};
