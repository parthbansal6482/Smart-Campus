import { create } from 'zustand';
import { MenuItem } from '../types';
import { cafeteriaService } from '../services/cafeteria.service';
import { realtimeEvents, REALTIME_EVENTS } from '../services/realtimeEvents';

interface CartLine {
  item: MenuItem;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  add: (item: MenuItem, quantity?: number) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  /** Replaces each line's dish data with fresh copies; dishes missing from `fresh` are marked unavailable. */
  syncItems: (fresh: MenuItem[]) => void;
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

  syncItems: fresh =>
    set(state => ({
      lines: state.lines.map(line => {
        const current = fresh.find(m => m.id === line.item.id);
        return { ...line, item: current ?? { ...line.item, isAvailable: false } };
      }),
    })),

  clear: () => set({ lines: [] }),
}));

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.quantity, 0);
export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0);

/** Whether a cart line can still be ordered as-is (dish on the menu, enough portions left). */
export const lineProblem = (line: CartLine): string | null => {
  if (!line.item.isAvailable) return 'No longer available';
  if (line.item.stock != null && line.item.stock < line.quantity) return `Only ${line.item.stock} left`;
  return null;
};

// Keep cart contents in step with the live menu: price changes, sell-outs and removals show up
// in the cart immediately instead of failing at checkout.
realtimeEvents.on(REALTIME_EVENTS.cafeteriaMenuChanged, async () => {
  if (useCartStore.getState().lines.length === 0) return;
  try {
    useCartStore.getState().syncItems(await cafeteriaService.getMenu());
  } catch {
    /* keep the cart as it was; the server re-validates when the order is placed */
  }
});
