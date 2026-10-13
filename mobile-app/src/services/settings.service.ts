import { api } from './api';
import { CampusSettings } from '../types';

export const settingsService = {
  get: async (): Promise<CampusSettings> => {
    const res = await api.get<{ success: boolean; data: CampusSettings }>('/settings');
    return res.data.data;
  },
};
