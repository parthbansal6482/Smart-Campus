import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { classroomService } from '../services/classroom.service';
import { Room, Booking } from '../types';
import { Power, Tv, Users, Calendar } from 'lucide-react';

export const ClassroomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [roomsRes, bookingsRes] = await Promise.allSettled([
        classroomService.getRooms(),
        classroomService.getBookings(true),
      ]);
      if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value);
      if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleFacility = async (roomId: string, currentStatus: { hasAC: boolean; hasProjector: boolean; isOccupied: boolean }, key: 'hasAC' | 'hasProjector' | 'isOccupied') => {
    try {
      const updated = await classroomService.updateFacilities(roomId, {
        [key]: !currentStatus[key],
      });
      setRooms(prev => prev.map(r => (r.id === roomId ? { ...r, ...updated } : r)));
    } catch (err) {
      console.error('Failed to update facility', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Smart Classroom & Facility Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time room occupancy and automated HVAC/AV equipment
          </p>
        </div>
      </div>

      {/* Classrooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(rooms.length > 0
          ? rooms
          : [
              { id: '1', roomNumber: 'ENG-101', floor: 1, capacity: 60, hasAC: true, hasProjector: true, isOccupied: false, building: { name: 'Engineering Hall', code: 'ENG', id: 'b1', latitude: 0, longitude: 0, floorCount: 4 } },
              { id: '2', roomNumber: 'ENG-204', floor: 2, capacity: 35, hasAC: true, hasProjector: true, isOccupied: true, building: { name: 'Engineering Hall', code: 'ENG', id: 'b1', latitude: 0, longitude: 0, floorCount: 4 } },
              { id: '3', roomNumber: 'SCI-LabA', floor: 1, capacity: 25, hasAC: false, hasProjector: true, isOccupied: false, building: { name: 'Science Complex', code: 'SCI', id: 'b2', latitude: 0, longitude: 0, floorCount: 3 } },
            ]
        ).map(room => (
          <Card key={room.id} className="relative transition-all hover:border-slate-300">
            <CardHeader className="pb-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {room.building?.name || 'Academic Block'}
                </span>
                <CardTitle className="text-lg">{room.roomNumber}</CardTitle>
              </div>
              <Badge variant={room.isOccupied ? 'warning' : 'success'}>
                {room.isOccupied ? 'Occupied' : 'Vacant'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {room.capacity} Seats
                </span>
                <span>Floor {room.floor}</span>
              </div>

              {/* Facility Automation Controls */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Automated Controls</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleFacility(room.id, room, 'hasAC')}
                    title="Toggle AC/HVAC"
                    className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                      room.hasAC
                        ? 'bg-campus-50 border-campus-200 text-campus-700'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    AC
                  </button>

                  <button
                    onClick={() => toggleFacility(room.id, room, 'hasProjector')}
                    title="Toggle Projector / AV"
                    className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                      room.hasProjector
                        ? 'bg-purple-50 border-purple-200 text-purple-700'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    AV
                  </button>

                  <button
                    onClick={() => toggleFacility(room.id, room, 'isOccupied')}
                    title="Override Occupancy"
                    className="p-2 rounded-lg text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                  >
                    Toggle Load
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Classroom Reservation Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <CardTitle>Recent Classroom Bookings & Schedule</CardTitle>
          </div>
        </CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Room</TableHeaderCell>
              <TableHeaderCell>Booked By</TableHeaderCell>
              <TableHeaderCell>Purpose</TableHeaderCell>
              <TableHeaderCell>Time Range</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(bookings.length > 0
              ? bookings
              : [
                  {
                    id: 'b1',
                    roomId: '1',
                    userId: 'u1',
                    startTime: new Date().toISOString(),
                    endTime: new Date(Date.now() + 7200000).toISOString(),
                    purpose: 'CS401: Distributed Systems Lecture',
                    status: 'CONFIRMED' as const,
                    room: { roomNumber: 'ENG-101' } as Room,
                    user: { name: 'Dr. Sarah Connor', email: 'faculty@smartcampus.edu' } as any,
                  },
                ]
            ).map(booking => (
              <TableRow key={booking.id}>
                <TableCell className="font-semibold text-slate-900">
                  {booking.room?.roomNumber || 'Room'}
                </TableCell>
                <TableCell>
                  <p className="text-xs font-medium text-slate-900">{booking.user?.name}</p>
                  <p className="text-[11px] text-slate-400">{booking.user?.email}</p>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {booking.purpose || 'Academic Reservation'}
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                  {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell>
                  <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'default'}>
                    {booking.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
