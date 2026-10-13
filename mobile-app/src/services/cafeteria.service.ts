import { api } from './api';
import { MenuItem, MenuReview, Order, ReorderLine } from '../types';

export type MenuSort = 'name' | 'price_asc' | 'rating' | 'popular' | 'calories';

export interface MenuFilters {
  search?: string;
  sort?: MenuSort;
  vegOnly?: boolean;
  maxCalories?: number;
  /** Allergens to leave out, e.g. ['dairy', 'nuts']. */
  excludeAllergens?: string[];
}

export const cafeteriaService = {
  getMenu: async (filters: MenuFilters = {}): Promise<MenuItem[]> => {
    const res = await api.get<{ success: boolean; data: MenuItem[] }>('/cafeteria/menu', {
      params: {
        search: filters.search?.trim() || undefined,
        sort: filters.sort,
        isVeg: filters.vegOnly ? true : undefined,
        maxCalories: filters.maxCalories,
        excludeAllergens: filters.excludeAllergens?.length ? filters.excludeAllergens.join(',') : undefined,
      },
    });
    return res.data.data;
  },

  getMenuItem: async (id: string): Promise<MenuItem> => {
    const res = await api.get<{ success: boolean; data: MenuItem }>(`/cafeteria/menu/${id}`);
    return res.data.data;
  },

  /** The signed-in user's order history, newest first, 20 per page. */
  getMyOrders: async (page = 1): Promise<{ orders: Order[]; totalPages: number }> => {
    const res = await api.get<{ success: boolean; data: Order[]; meta?: { totalPages: number } }>('/cafeteria/orders', {
      params: { page },
    });
    return { orders: res.data.data, totalPages: res.data.meta?.totalPages ?? 1 };
  },

  /** Past order's lines with today's price and availability, ready to drop into the cart. */
  getReorderLines: async (orderId: string): Promise<ReorderLine[]> => {
    const res = await api.get<{ success: boolean; data: ReorderLine[] }>(`/cafeteria/orders/${orderId}/reorder`);
    return res.data.data;
  },

  getReviews: async (
    menuItemId: string
  ): Promise<{ reviews: MenuReview[]; distribution: Record<number, number> }> => {
    const res = await api.get<{ success: boolean; data: { reviews: MenuReview[]; distribution: Record<number, number> } }>(
      `/cafeteria/menu/${menuItemId}/reviews`
    );
    return res.data.data;
  },

  getMyReviewState: async (menuItemId: string): Promise<{ canReview: boolean; review: MenuReview | null }> => {
    const res = await api.get<{ success: boolean; data: { canReview: boolean; review: MenuReview | null } }>(
      `/cafeteria/menu/${menuItemId}/reviews/mine`
    );
    return res.data.data;
  },

  saveReview: async (menuItemId: string, data: { rating: number; comment?: string }): Promise<void> => {
    await api.put(`/cafeteria/menu/${menuItemId}/reviews/mine`, data);
  },

  deleteReview: async (menuItemId: string): Promise<void> => {
    await api.delete(`/cafeteria/menu/${menuItemId}/reviews/mine`);
  },

  placeOrder: async (data: {
    orderType: Order['orderType'];
    pickupTime?: string;
    tableNumber?: string;
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
