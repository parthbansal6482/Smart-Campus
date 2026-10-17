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

/** The API rejects more than this many of one dish in a single order. */
export const MAX_LINE_QUANTITY = 20;

/** The most of a dish that can go in the cart: the per-line cap, or the portions left if tracked. */
export const maxQuantityFor = (item: MenuItem) => Math.min(MAX_LINE_QUANTITY, item.stock != null ? Math.max(item.stock, 1) : MAX_LINE_QUANTITY);

/** Local-only cart state — the order itself is placed against the real API
 *  (see cafeteria.service.ts) once the student confirms it. */
export const useCartStore = create<CartState>(set => ({
  lines: [],

  add: (item, quantity = 1) =>
    set(state => {
      const existing = state.lines.find(l => l.item.id === item.id);
      if (existing) {
        return {
          lines: state.lines.map(l => (l.item.id === item.id ? { ...l, quantity: Math.min(l.quantity + quantity, maxQuantityFor(l.item)) } : l)),
        };
      }
      return { lines: [...state.lines, { item, quantity: Math.min(quantity, maxQuantityFor(item)) }] };
    }),

  setQuantity: (itemId, quantity) =>
    set(state => ({
      lines:
        quantity <= 0
          ? state.lines.filter(l => l.item.id !== itemId)
          : state.lines.map(l => (l.item.id === itemId ? { ...l, quantity: Math.min(quantity, MAX_LINE_QUANTITY) } : l)),
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
