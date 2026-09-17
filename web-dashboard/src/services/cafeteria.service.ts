import { api } from './api';
import { ApiResponse, MenuItem, Order, OrderStatus } from '../types';

export const cafeteriaService = {
  getMenu: async (category?: string): Promise<MenuItem[]> => {
    const res = await api.get<ApiResponse<MenuItem[]>>('/cafeteria/menu', { params: { category } });
    return res.data.data;
  },

  createMenuItem: async (item: Partial<MenuItem>): Promise<MenuItem> => {
    const res = await api.post<ApiResponse<MenuItem>>('/cafeteria/menu', item);
    return res.data.data;
  },

  updateMenuItem: async (id: string, item: Partial<MenuItem>): Promise<MenuItem> => {
    const res = await api.patch<ApiResponse<MenuItem>>(`/cafeteria/menu/${id}`, item);
    return res.data.data;
  },

  deleteMenuItem: async (id: string): Promise<void> => {
    await api.delete(`/cafeteria/menu/${id}`);
  },

  getOrders: async (all = true, status?: OrderStatus): Promise<Order[]> => {
    const res = await api.get<ApiResponse<Order[]>>('/cafeteria/orders', { params: { all, status } });
    return res.data.data;
  },

  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const res = await api.patch<ApiResponse<Order>>(`/cafeteria/orders/${id}/status`, { status });
    return res.data.data;
  },
};
