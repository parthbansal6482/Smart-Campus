import { api } from './api';
import { Booking, Room } from '../types';

export const classroomService = {
  getRooms: async (params?: { buildingId?: string; isOccupied?: boolean }): Promise<Room[]> => {
    const res = await api.get<{ success: boolean; data: Room[] }>('/classrooms/rooms', { params });
    return res.data.data;
  },

  getAvailableRooms: async (startTime: string, endTime: string, buildingId?: string): Promise<Room[]> => {
    const res = await api.get<{ success: boolean; data: Room[] }>('/classrooms/rooms/available', {
      params: { startTime, endTime, buildingId },
    });
    return res.data.data;
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const res = await api.get<{ success: boolean; data: Booking[] }>('/classrooms/bookings');
    return res.data.data;
  },

  createBooking: async (data: { roomId: string; startTime: string; endTime: string; purpose?: string }): Promise<Booking> => {
    const res = await api.post<{ success: boolean; data: Booking }>('/classrooms/bookings', data);
    return res.data.data;
  },

  cancelBooking: async (id: string): Promise<Booking> => {
    const res = await api.patch<{ success: boolean; data: Booking }>(`/classrooms/bookings/${id}/status`, {
      status: 'CANCELLED',
    });
    return res.data.data;
  },
};
