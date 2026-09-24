import { api } from './api';
import { ApiResponse, Building, Room, Booking, BookingStatus } from '../types';

export const classroomService = {
  getBuildings: async (): Promise<Building[]> => {
    const res = await api.get<ApiResponse<Building[]>>('/classrooms/buildings');
    return res.data.data;
  },

  getRooms: async (params?: { buildingId?: string; isOccupied?: boolean }): Promise<Room[]> => {
    const res = await api.get<ApiResponse<Room[]>>('/classrooms/rooms', { params });
    return res.data.data;
  },

  getRoomById: async (id: string): Promise<Room> => {
    const res = await api.get<ApiResponse<Room>>(`/classrooms/rooms/${id}`);
    return res.data.data;
  },

  updateFacilities: async (id: string, facilities: { hasAC?: boolean; hasProjector?: boolean; isOccupied?: boolean }): Promise<Room> => {
    const res = await api.patch<ApiResponse<Room>>(`/classrooms/rooms/${id}/facilities`, facilities);
    return res.data.data;
  },

  getBookings: async (all = true): Promise<Booking[]> => {
    const res = await api.get<ApiResponse<Booking[]>>('/classrooms/bookings', { params: { all } });
    return res.data.data;
  },

  updateBookingStatus: async (id: string, status: BookingStatus): Promise<Booking> => {
    const res = await api.patch<ApiResponse<Booking>>(`/classrooms/bookings/${id}/status`, { status });
    return res.data.data;
  },
};
