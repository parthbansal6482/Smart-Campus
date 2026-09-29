import { create } from 'zustand';
import { MenuItem } from '../types';

interface CartLine {
  item: MenuItem;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  add: (item: MenuItem, quantity?: number) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
}

/** Local-only cart state — the order itself is placed against the real API
 *  (see cafeteria.service.ts) once the student confirms it. */
export const useCartStore = create<CartState>(set => ({
  lines: [],

  add: (item, quantity = 1) =>
    set(state => {
      const existing = state.lines.find(l => l.item.id === item.id);
      if (existing) {
        return {
          lines: state.lines.map(l => (l.item.id === item.id ? { ...l, quantity: l.quantity + quantity } : l)),
        };
      }
      return { lines: [...state.lines, { item, quantity }] };
    }),

  setQuantity: (itemId, quantity) =>
    set(state => ({
      lines:
        quantity <= 0
          ? state.lines.filter(l => l.item.id !== itemId)
          : state.lines.map(l => (l.item.id === itemId ? { ...l, quantity } : l)),
    })),

  clear: () => set({ lines: [] }),
}));

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.quantity, 0);
export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0);
