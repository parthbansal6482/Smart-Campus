import { api } from './api';
import { ApiResponse, CampusSettings } from '../types';

export const settingsService = {
  get: async (): Promise<CampusSettings> => {
    const res = await api.get<ApiResponse<CampusSettings>>('/settings');
    return res.data.data;
  },

  update: async (patch: Partial<CampusSettings>): Promise<CampusSettings> => {
    const res = await api.put<ApiResponse<CampusSettings>>('/settings', patch);
    return res.data.data;
  },
};
