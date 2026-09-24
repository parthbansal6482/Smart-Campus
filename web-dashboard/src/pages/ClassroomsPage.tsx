import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, DoorOpen, Search } from 'lucide-react';
import { classroomService } from '../services/classroom.service';
import { Room, Booking, BookingStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Switch } from '../components/ui/Field';
import { Tabs, Segmented } from '../components/ui/Tabs';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { EmptyState, PageHeader, SkeletonRows } from '../components/ui/Feedback';
import { ConfirmDialog } from '../components/ui/Modal';
import { toast } from '../components/ui/Toast';
import { formatTimeRange, getErrorMessage, humanize } from '../lib/utils';
import type { Tone } from '../lib/status';

type Section = 'rooms' | 'bookings';
type OccupancyFilter = 'all' | 'free' | 'in-use';
type BookingFilter = 'upcoming' | 'past' | 'all';

const bookingTone: Record<BookingStatus, Tone> = {
  PENDING: 'info',
  CONFIRMED: 'ok',
  CANCELLED: 'neutral',
  COMPLETED: 'neutral',
};

export const ClassroomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>('rooms');
  const [building, setBuilding] = useState('all');
  const [occupancy, setOccupancy] = useState<OccupancyFilter>('all');
  const [search, setSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('upcoming');
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  useEffect(() => {
    (async () => {
      const [roomsRes, bookingsRes] = await Promise.allSettled([
        classroomService.getRooms(),
        classroomService.getBookings(true),
      ]);
      if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value);
      if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value);
      setLoading(false);
    })();
  }, []);

  const buildings = useMemo(() => {
    const map = new Map<string, string>();
    rooms.forEach(r => r.building && map.set(r.building.code, r.building.name));
    return Array.from(map.entries());
  }, [rooms]);

  const filteredRooms = rooms.filter(r => {
    if (building !== 'all' && r.building?.code !== building) return false;
    if (occupancy === 'free' && r.isOccupied) return false;
    if (occupancy === 'in-use' && !r.isOccupied) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.roomNumber.toLowerCase().includes(q) || r.building?.name.toLowerCase().includes(q);
    }
    return true;
  });

  const now = Date.now();
  const filteredBookings = bookings.filter(b => {
    const ended = new Date(b.endTime).getTime() < now;
    if (bookingFilter === 'upcoming') return !ended && b.status !== 'CANCELLED';
    if (bookingFilter === 'past') return ended || b.status === 'CANCELLED';
    return true;
  });
  const upcomingCount = bookings.filter(b => new Date(b.endTime).getTime() >= now && b.status !== 'CANCELLED').length;

  const updateRoom = async (room: Room, patch: Partial<Pick<Room, 'hasAC' | 'hasProjector' | 'isOccupied'>>) => {
    setPendingRoomId(room.id);
    try {
      const updated = await classroomService.updateFacilities(room.id, patch);
      setRooms(prev => prev.map(r => (r.id === room.id ? { ...r, ...updated } : r)));
      if ('isOccupied' in patch) toast.success(`${room.roomNumber} marked ${patch.isOccupied ? 'in use' : 'free'}`);
    } catch (err) {
      toast.error(getErrorMessage(err, `Couldn’t update ${room.roomNumber}.`));
    } finally {
      setPendingRoomId(null);
    }
  };

  const setBookingStatus = async (booking: Booking, status: BookingStatus) => {
    try {
      const updated = await classroomService.updateBookingStatus(booking.id, status);
      setBookings(prev => prev.map(b => (b.id === booking.id ? { ...b, status: updated.status } : b)));
      toast.success(status === 'CANCELLED' ? 'Booking cancelled' : `Booking ${humanize(status).toLowerCase()}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Couldn’t update the booking.'));
    } finally {
      setCancelTarget(null);
    }
  };

  const freeCount = rooms.filter(r => !r.isOccupied).length;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Classrooms"
        description={
          loading
            ? 'Room availability, equipment and bookings across campus.'
            : `${rooms.length} rooms across ${buildings.length} ${buildings.length === 1 ? 'building' : 'buildings'} · ${freeCount} free right now`
        }
      />

      <Tabs
        className="mb-6"
        value={section}
        onChange={setSection}
        items={[
          { value: 'rooms', label: 'Rooms', count: rooms.length },
          { value: 'bookings', label: 'Bookings', count: upcomingCount },
        ]}
      />

      {section === 'rooms' ? (
        <Card>
          <div className="flex flex-col xl:flex-row xl:items-center gap-3 justify-between p-4 border-b border-line">
            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                value={building}
                onChange={setBuilding}
                items={[{ value: 'all', label: 'All buildings' }, ...buildings.map(([code]) => ({ value: code, label: code }))]}
              />
              <Segmented
                value={occupancy}
                onChange={setOccupancy}
                items={[
                  { value: 'all', label: 'Any status' },
                  { value: 'free', label: 'Free' },
                  { value: 'in-use', label: 'In use' },
                ]}
              />
            </div>
            <div className="w-full xl:w-64">
              <Input
                aria-label="Search rooms"
                placeholder="Search rooms"
                value={search}
                onChange={e => setSearch(e.target.value)}
                leading={<Search className="w-4 h-4" />}
                className="h-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="pt-5">
              <SkeletonRows rows={4} />
            </div>
          ) : filteredRooms.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              title={rooms.length === 0 ? 'No rooms yet' : 'No rooms match these filters'}
              description={rooms.length === 0 ? 'Rooms added by an administrator will appear here.' : 'Try a different building or status.'}
            />
          ) : (
            <Table>
              <THead className="border-t-0">
                <tr>
                  <TH>Room</TH>
                  <TH>Building</TH>
                  <TH className="text-right">Seats</TH>
                  <TH>Air conditioning</TH>
                  <TH>Projector</TH>
                  <TH>Status</TH>
                  <TH className="text-right">
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {filteredRooms.map(room => (
                  <TR key={room.id}>
                    <TD>
                      <p className="text-ink font-medium">{room.roomNumber}</p>
                      <p className="text-xs text-ink-3">Floor {room.floor}</p>
                    </TD>
                    <TD>{room.building?.name}</TD>
                    <TD className="text-right tabular">{room.capacity}</TD>
                    <TD>
                      <Switch
                        label={`Air conditioning in ${room.roomNumber}`}
                        checked={room.hasAC}
                        disabled={pendingRoomId === room.id}
                        onChange={value => updateRoom(room, { hasAC: value })}
                      />
                    </TD>
                    <TD>
                      <Switch
                        label={`Projector in ${room.roomNumber}`}
                        checked={room.hasProjector}
                        disabled={pendingRoomId === room.id}
                        onChange={value => updateRoom(room, { hasProjector: value })}
                      />
                    </TD>
                    <TD>
                      <Badge tone={room.isOccupied ? 'warn' : 'ok'}>{room.isOccupied ? 'In use' : 'Free'}</Badge>
                    </TD>
                    <TD className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pendingRoomId === room.id}
                        onClick={() => updateRoom(room, { isOccupied: !room.isOccupied })}
                      >
                        {room.isOccupied ? 'Mark free' : 'Mark in use'}
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      ) : (
        <Card>
          <div className="p-4 border-b border-line">
            <Segmented
              value={bookingFilter}
              onChange={setBookingFilter}
              items={[
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'past', label: 'Past & cancelled' },
                { value: 'all', label: 'All' },
              ]}
            />
          </div>
          {loading ? (
            <div className="pt-5">
              <SkeletonRows rows={3} />
            </div>
          ) : filteredBookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={bookingFilter === 'upcoming' ? 'No upcoming bookings' : 'Nothing here yet'}
              description="Bookings made by students and faculty in the app appear here."
            />
          ) : (
            <Table>
              <THead className="border-t-0">
                <tr>
                  <TH>Room</TH>
                  <TH>When</TH>
                  <TH>Booked by</TH>
                  <TH>Purpose</TH>
                  <TH>Status</TH>
                  <TH className="text-right">
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {filteredBookings.map(booking => {
                  const ended = new Date(booking.endTime).getTime() < now;
                  return (
                    <TR key={booking.id}>
                      <TD>
                        <p className="text-ink font-medium">{booking.room?.roomNumber}</p>
                        <p className="text-xs text-ink-3">{booking.room?.building?.name}</p>
                      </TD>
                      <TD className="whitespace-nowrap">{formatTimeRange(booking.startTime, booking.endTime)}</TD>
                      <TD>
                        <p className="text-ink">{booking.user?.name}</p>
                        <p className="text-xs text-ink-3">{booking.user?.role && humanize(booking.user.role)}</p>
                      </TD>
                      <TD className="max-w-[220px] truncate">{booking.purpose || '—'}</TD>
                      <TD>
                        <Badge tone={bookingTone[booking.status]}>{humanize(booking.status)}</Badge>
                      </TD>
                      <TD className="text-right whitespace-nowrap">
                        {booking.status === 'PENDING' && (
                          <Button size="sm" variant="secondary" onClick={() => setBookingStatus(booking, 'CONFIRMED')}>
                            Approve
                          </Button>
                        )}
                        {!ended && (booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                          <Button size="sm" variant="ghost" onClick={() => setCancelTarget(booking)}>
                            Cancel
                          </Button>
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>
      )}

      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel booking?"
        description={
          cancelTarget
            ? `${cancelTarget.room?.roomNumber} for ${cancelTarget.user?.name} (${formatTimeRange(cancelTarget.startTime, cancelTarget.endTime)}) will be released.`
            : ''
        }
        confirmLabel="Cancel booking"
        destructive
        onConfirm={() => cancelTarget && setBookingStatus(cancelTarget, 'CANCELLED')}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
};
