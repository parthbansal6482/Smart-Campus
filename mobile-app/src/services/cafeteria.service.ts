import { api } from './api';
import { MenuItem, Order } from '../types';

export const cafeteriaService = {
  getMenu: async (category?: string): Promise<MenuItem[]> => {
    const res = await api.get<{ success: boolean; data: MenuItem[] }>('/cafeteria/menu', { params: { category } });
    return res.data.data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const res = await api.get<{ success: boolean; data: Order[] }>('/cafeteria/orders');
    return res.data.data;
  },

  placeOrder: async (data: {
    orderType: Order['orderType'];
    pickupTime?: string;
    note?: string;
    offerCode?: string;
    items: Array<{ menuItemId: string; quantity: number }>;
  }): Promise<Order> => {
    const res = await api.post<{ success: boolean; data: Order }>('/cafeteria/orders', data);
    return res.data.data;
  },

  cancelOrder: async (id: string): Promise<Order> => {
    const res = await api.patch<{ success: boolean; data: Order }>(`/cafeteria/orders/${id}/status`, {
      status: 'CANCELLED',
    });
    return res.data.data;
  },
};
