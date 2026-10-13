import { api } from './api';
import { ApiResponse, CafeteriaStats, MenuItem, MenuReview, Order, OrderStatus } from '../types';

type ClearableField = 'stock' | 'servingSize' | 'calories' | 'proteinG' | 'carbsG' | 'fatG' | 'fiberG' | 'sugarG' | 'sodiumMg';

/** Menu item payload where the optional nutrition scalars may be null (clears the stored value on update). */
export type MenuItemInput = Partial<Omit<MenuItem, ClearableField>> & {
  [K in ClearableField]?: MenuItem[K] | null;
};

export interface OrderSearch {
  status?: OrderStatus;
  search?: string;
  /** ISO timestamps. */
  from?: string;
  to?: string;
  page?: number;
}

export const cafeteriaService = {
  getMenu: async (opts: { category?: string; includeArchived?: boolean } = {}): Promise<MenuItem[]> => {
    const res = await api.get<ApiResponse<MenuItem[]>>('/cafeteria/menu', {
      params: { category: opts.category, includeArchived: opts.includeArchived ? true : undefined },
    });
    return res.data.data;
  },

  restoreMenuItem: async (id: string): Promise<MenuItem> => {
    const res = await api.patch<ApiResponse<MenuItem>>(`/cafeteria/menu/${id}`, { isArchived: false, isAvailable: true });
    return res.data.data;
  },

  getReviews: async (menuItemId: string): Promise<MenuReview[]> => {
    const res = await api.get<ApiResponse<{ reviews: MenuReview[] }>>(`/cafeteria/menu/${menuItemId}/reviews`, { params: { limit: 50 } });
    return res.data.data.reviews;
  },

  deleteReview: async (menuItemId: string, reviewId: string): Promise<void> => {
    await api.delete(`/cafeteria/menu/${menuItemId}/reviews/${reviewId}`);
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

  // The live board needs every open order, not just the first page.
  getOrders: async (all = true, status?: OrderStatus): Promise<Order[]> => {
    const res = await api.get<ApiResponse<Order[]>>('/cafeteria/orders', { params: { all, status, limit: 100 } });
    return res.data.data;
  },

  searchOrders: async (query: OrderSearch): Promise<{ orders: Order[]; total: number; totalPages: number }> => {
    const res = await api.get<ApiResponse<Order[]> & { meta: { total: number; totalPages: number } }>('/cafeteria/orders', {
      params: { all: true, limit: 15, ...query },
    });
    return { orders: res.data.data, total: res.data.meta.total, totalPages: res.data.meta.totalPages };
  },

  getStats: async (): Promise<CafeteriaStats> => {
    const res = await api.get<ApiResponse<CafeteriaStats>>('/cafeteria/stats');
    return res.data.data;
  },

  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const res = await api.patch<ApiResponse<Order>>(`/cafeteria/orders/${id}/status`, { status });
    return res.data.data;
  },
};
