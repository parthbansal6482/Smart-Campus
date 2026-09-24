import { create } from 'zustand';
import { MenuItem, Order } from '../types';
import { MENU } from '../data/mock';

interface CartLine {
  item: MenuItem;
  quantity: number;
}

interface PlaceOrderInput {
  orderType: Order['orderType'];
  pickupTime?: string;
  note?: string;
}

interface CartState {
  lines: CartLine[];
  orders: Order[];
  add: (item: MenuItem, quantity?: number) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
  placeOrder: (input: PlaceOrderInput) => Order;
}

const seedOrders = (): Order[] => {
  const now = Date.now();
  const line = (id: string, quantity: number) => {
    const menuItem = MENU.find(m => m.id === id)!;
    return { id: `prev-${id}`, quantity, unitPrice: menuItem.price, menuItem };
  };
  return [
    {
      id: 'o-prev',
      userId: 'me',
      orderType: 'PICKUP',
      orderToken: '#ORD-417',
      status: 'COLLECTED',
      totalAmount: 130,
      createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      orderItems: [line('m7', 1), line('m9', 1), line('m10', 1)],
    },
  ];
};

/**
 * Cart and order history held on the device.
 * Orders are not sent to the kitchen yet — this keeps the ordering flow usable until the app is wired to the API.
 */
export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  orders: seedOrders(),

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

  placeOrder: ({ orderType, pickupTime, note }) => {
    const { lines } = get();
    const order: Order = {
      id: `o-${Date.now()}`,
      userId: 'me',
      orderType,
      orderToken: `#ORD-${Math.floor(100 + Math.random() * 900)}`,
      status: 'PLACED',
      pickupTime,
      note,
      totalAmount: lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0),
      createdAt: new Date().toISOString(),
      orderItems: lines.map(l => ({ id: l.item.id, quantity: l.quantity, unitPrice: l.item.price, menuItem: l.item })),
    };
    set(state => ({ orders: [order, ...state.orders], lines: [] }));
    return order;
  },
}));

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.quantity, 0);
export const cartTotal = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0);
