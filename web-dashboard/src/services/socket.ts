import { io, Socket } from 'socket.io-client';
import { tokenStorage } from './api';
import { toast } from '../components/ui/Toast';

/** Fired on window whenever a live event means a page's data is stale — pages
 *  subscribe to these to refetch immediately instead of waiting for their
 *  polling interval. Kept as plain DOM events rather than a bespoke pub/sub
 *  so pages don't need to import socket.ts directly. */
export const REALTIME_EVENTS = {
  cafeteriaOrdersChanged: 'realtime:cafeteria-orders-changed',
  cafeteriaMenuChanged: 'realtime:cafeteria-menu-changed',
  bookingsChanged: 'realtime:bookings-changed',
  usersChanged: 'realtime:users-changed',
  notificationsChanged: 'realtime:notifications-changed',
  settingsChanged: 'realtime:settings-changed',
  classroomsChanged: 'realtime:classrooms-changed',
  medicalChanged: 'realtime:medical-changed',
} as const;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
// The socket server is attached to the same HTTP server as the REST API,
// one level up from the versioned /api/v1 prefix.
const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

/** What a `data:changed` hint from the server means for the pages: which window events to fire. */
const RESOURCE_EVENTS: Record<string, string[]> = {
  menu: [REALTIME_EVENTS.cafeteriaMenuChanged],
  reviews: [REALTIME_EVENTS.cafeteriaMenuChanged],
  rooms: [REALTIME_EVENTS.classroomsChanged],
  buildings: [REALTIME_EVENTS.classroomsChanged],
  schedules: [REALTIME_EVENTS.classroomsChanged],
  bookings: [REALTIME_EVENTS.bookingsChanged, REALTIME_EVENTS.classroomsChanged],
  emergencies: [REALTIME_EVENTS.medicalChanged],
  consultations: [REALTIME_EVENTS.medicalChanged],
  medicineOrders: [REALTIME_EVENTS.medicalChanged],
  medicines: [REALTIME_EVENTS.medicalChanged],
  users: [REALTIME_EVENTS.usersChanged],
  notifications: [REALTIME_EVENTS.notificationsChanged],
  settings: [REALTIME_EVENTS.settingsChanged],
};

const dispatch = (name: string, detail?: unknown) => window.dispatchEvent(new CustomEvent(name, { detail }));

/**
 * Opens the realtime connection for the current session. The backend
 * authenticates the handshake itself (see socket.server.ts) and derives
 * room membership from the token's role — the client never declares which
 * broadcast rooms it belongs to.
 */
export const connectSocket = (): Socket | null => {
  if (!tokenStorage.getAccessToken()) return null;
  // Also covers a socket that is still connecting/reconnecting — opening a
  // second one would double-deliver every event.
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    // A callback so every (re)connect uses the current access token rather
    // than the one captured at first connect, which may have since expired.
    auth: cb => cb({ token: tokenStorage.getAccessToken() }),
    transports: ['websocket'],
  });

  socket.on('notification:new', (notification: { type?: string; title?: string; body?: string }) => {
    toast.success(notification.title ? `${notification.title}${notification.body ? ` — ${notification.body}` : ''}` : 'New notification');

    if (notification.type === 'EMERGENCY' || notification.type === 'CONSULTATION') {
      window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.medicalChanged));
    } else if (notification.type === 'ORDER') {
      window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.cafeteriaOrdersChanged));
    } else if (notification.type === 'MEDICINE_ORDER') {
      window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.medicalChanged));
    }
  });

  // The server announces which kind of data changed (menu, rooms, bookings, emergencies, users...);
  // pages listen for the matching window event and refetch what they show.
  socket.on('data:changed', (change: { resource: string; action: string; ids: string[] }) => {
    RESOURCE_EVENTS[change.resource]?.forEach(name => dispatch(name, change));
  });

  // The server drops our connection when our role or status changes (so rooms are re-derived).
  // socket.io doesn't retry that kind of disconnect by itself, so reconnect explicitly.
  socket.on('disconnect', reason => {
    if (reason === 'io server disconnect') socket?.connect();
  });

  // The server refuses the handshake for a deactivated account: sign out instead of retrying forever.
  socket.on('connect_error', (error: Error) => {
    if (/deactivated/i.test(error.message)) window.dispatchEvent(new CustomEvent('realtime:account-deactivated'));
  });

  // After a dropped connection comes back, events may have been missed: refetch everything.
  socket.on('connect', () => {
    Object.values(REALTIME_EVENTS).forEach(name => window.dispatchEvent(new CustomEvent(name)));
  });

  socket.on('order:new', () => window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.cafeteriaOrdersChanged)));
  socket.on('order:status_updated', () => window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.cafeteriaOrdersChanged)));
  socket.on('classroom:occupancy_updated', () => window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.classroomsChanged)));
  socket.on('classroom:list_updated', () => window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.classroomsChanged)));

  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = (): Socket | null => socket;
