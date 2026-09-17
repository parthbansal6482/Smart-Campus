import { api } from './api';
import { ApiResponse, Emergency, EmergencyStatus } from '../types';

export const emergencyService = {
  getActive: async (): Promise<Emergency[]> => {
    const res = await api.get<ApiResponse<Emergency[]>>('/emergency/active');
    return res.data.data;
  },

  getAll: async (): Promise<Emergency[]> => {
    const res = await api.get<ApiResponse<Emergency[]>>('/emergency');
    return res.data.data;
  },

  updateStatus: async (id: string, status: EmergencyStatus): Promise<Emergency> => {
    const res = await api.patch<ApiResponse<Emergency>>(`/emergency/${id}/status`, { status });
    return res.data.data;
  },
};
