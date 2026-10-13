import { api } from './api';
import { AppNotification } from '../types';

export const notificationService = {
  list: async (): Promise<{ notifications: AppNotification[]; unreadCount: number }> => {
    const res = await api.get<{ success: boolean; data: AppNotification[]; meta?: { unreadCount?: number } }>('/notifications', {
      params: { limit: 50 },
    });
    return { notifications: res.data.data, unreadCount: res.data.meta?.unreadCount ?? 0 };
  },

  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
