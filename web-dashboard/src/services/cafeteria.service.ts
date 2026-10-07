import { api } from './api';
import { ApiResponse, MenuItem, Order, OrderStatus } from '../types';

type ClearableField = 'servingSize' | 'calories' | 'proteinG' | 'carbsG' | 'fatG' | 'fiberG' | 'sugarG' | 'sodiumMg';

/** Menu item payload where the optional nutrition scalars may be null (clears the stored value on update). */
export type MenuItemInput = Partial<Omit<MenuItem, ClearableField>> & {
  [K in ClearableField]?: MenuItem[K] | null;
};

export const cafeteriaService = {
  getMenu: async (category?: string): Promise<MenuItem[]> => {
    const res = await api.get<ApiResponse<MenuItem[]>>('/cafeteria/menu', { params: { category } });
    return res.data.data;
  },

  createMenuItem: async (item: MenuItemInput): Promise<MenuItem> => {
    const res = await api.post<ApiResponse<MenuItem>>('/cafeteria/menu', item);
    return res.data.data;
  },

  updateMenuItem: async (id: string, item: MenuItemInput): Promise<MenuItem> => {
    const res = await api.patch<ApiResponse<MenuItem>>(`/cafeteria/menu/${id}`, item);
    return res.data.data;
  },

  deleteMenuItem: async (id: string): Promise<void> => {
    await api.delete(`/cafeteria/menu/${id}`);
  },

  uploadPhoto: async (file: File): Promise<string> => {
    const body = new FormData();
    body.append('file', file);
    const res = await api.post<ApiResponse<{ url: string }>>('/uploads', body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.url;
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
