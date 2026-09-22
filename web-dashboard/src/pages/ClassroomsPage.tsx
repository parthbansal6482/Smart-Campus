import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { classroomService } from '../services/classroom.service';
import { Room, Booking } from '../types';
import { Power, Tv, Users, Calendar, Filter, Sparkles, CheckCircle2, ShieldCheck, Thermometer } from 'lucide-react';

export const ClassroomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');

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

  const displayRooms = rooms.length > 0 ? rooms : [
    { id: '1', roomNumber: 'ENG-101', floor: 1, capacity: 60, hasAC: true, hasProjector: true, isOccupied: false, building: { name: 'Alan Turing Engineering Hall', code: 'ENG', id: 'b1', latitude: 0, longitude: 0, floorCount: 4 } },
    { id: '2', roomNumber: 'ENG-204', floor: 2, capacity: 35, hasAC: true, hasProjector: true, isOccupied: true, building: { name: 'Alan Turing Engineering Hall', code: 'ENG', id: 'b1', latitude: 0, longitude: 0, floorCount: 4 } },
    { id: '3', roomNumber: 'SCI-LabA', floor: 1, capacity: 25, hasAC: false, hasProjector: true, isOccupied: false, building: { name: 'Marie Curie Science Complex', code: 'SCI', id: 'b2', latitude: 0, longitude: 0, floorCount: 3 } },
  ];

  const filteredRooms = displayRooms.filter(r => {
    if (selectedBuilding === 'ALL') return true;
    return r.building?.code === selectedBuilding;
  });

  const vacantCount = displayRooms.filter(r => !r.isOccupied).length;
  const acActiveCount = displayRooms.filter(r => r.hasAC).length;

  return (
    <div className="space-y-6">
      {/* Header & Metric Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Facility Automation</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Smart Classroom & Facility Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time room occupancy, schedules, and automated HVAC/AV climate controls
          </p>
        </div>

        {/* Quick Facility Stat Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
            <span className="text-emerald-800 font-bold">{vacantCount}</span>
            <span className="text-emerald-600 ml-1">Vacant Now</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs">
            <span className="text-blue-800 font-bold">{acActiveCount}</span>
            <span className="text-blue-600 ml-1">Climate On</span>
          </div>
        </div>
      </div>

      {/* Building Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedBuilding('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            selectedBuilding === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Buildings ({displayRooms.length})
        </button>
        <button
          onClick={() => setSelectedBuilding('ENG')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            selectedBuilding === 'ENG'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Engineering Hall (ENG)
        </button>
        <button
          onClick={() => setSelectedBuilding('SCI')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            selectedBuilding === 'SCI'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Science Complex (SCI)
        </button>
      </div>

      {/* Classrooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map(room => (
          <Card key={room.id} interactive className="flex flex-col justify-between">
            <CardHeader className="pb-3 bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {room.building?.name || 'Academic Block'}
                </span>
                <CardTitle className="text-base text-slate-900 font-bold mt-0.5">{room.roomNumber}</CardTitle>
              </div>
              <Badge variant={room.isOccupied ? 'warning' : 'success'} dot>
                {room.isOccupied ? 'Occupied' : 'Vacant'}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Capacity</span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    {room.capacity} Student Seats
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Location</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    Floor {room.floor}
                  </span>
                </div>
              </div>

              {/* IoT Automated Climate & AV Controls */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">IoT Controls</span>
                  <span className="text-[10px] text-slate-400">Instant Telemetry</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => toggleFacility(room.id, room, 'hasAC')}
                    title="Toggle HVAC/Climate control"
                    className={`p-2 rounded-lg text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-1 ${
                      room.hasAC
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <Power className={`w-3.5 h-3.5 ${room.hasAC ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="text-[10px]">{room.hasAC ? 'HVAC On' : 'HVAC Off'}</span>
                  </button>

                  <button
                    onClick={() => toggleFacility(room.id, room, 'hasProjector')}
                    title="Toggle AV & Projector"
                    className={`p-2 rounded-lg text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-1 ${
                      room.hasProjector
                        ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <Tv className={`w-3.5 h-3.5 ${room.hasProjector ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span className="text-[10px]">{room.hasProjector ? 'AV Ready' : 'AV Off'}</span>
                  </button>

                  <button
                    onClick={() => toggleFacility(room.id, room, 'isOccupied')}
                    title="Override occupancy status"
                    className={`p-2 rounded-lg text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-1 ${
                      room.isOccupied
                        ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-2xs'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70'
                    }`}
                  >
                    <Users className={`w-3.5 h-3.5 ${room.isOccupied ? 'text-amber-600' : 'text-emerald-600'}`} />
                    <span className="text-[10px]">{room.isOccupied ? 'Set Vacant' : 'Set In-Use'}</span>
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
            <Calendar className="w-4 h-4 text-blue-600" />
            <div>
              <CardTitle>Classroom Reservation Schedule</CardTitle>
              <p className="text-[11px] text-slate-400">Upcoming faculty and student study sessions</p>
            </div>
          </div>
        </CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Room</TableHeaderCell>
              <TableHeaderCell>Booked By</TableHeaderCell>
              <TableHeaderCell>Session Purpose</TableHeaderCell>
              <TableHeaderCell>Time Range</TableHeaderCell>
              <TableHeaderCell>Reservation Status</TableHeaderCell>
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
                <TableCell className="font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>{booking.room?.roomNumber || 'ENG-101'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-semibold text-slate-900">{booking.user?.name || 'Faculty Member'}</p>
                  <p className="text-[11px] text-slate-400">{booking.user?.email || 'campus@smartcampus.edu'}</p>
                </TableCell>
                <TableCell className="text-xs text-slate-700 font-medium">
                  {booking.purpose || 'Academic Reservation'}
                </TableCell>
                <TableCell className="text-xs text-slate-500 font-mono tabular-nums">
                  {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                  {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </TableCell>
                <TableCell>
                  <Badge variant={booking.status === 'CONFIRMED' ? 'success' : 'default'} dot>
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
