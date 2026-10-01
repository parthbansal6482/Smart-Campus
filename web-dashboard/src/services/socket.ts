import { io, Socket } from 'socket.io-client';
import { tokenStorage } from './api';
import { toast } from '../components/ui/Toast';

/** Fired on window whenever a live event means a page's data is stale — pages
 *  subscribe to these to refetch immediately instead of waiting for their
 *  polling interval. Kept as plain DOM events rather than a bespoke pub/sub
 *  so pages don't need to import socket.ts directly. */
export const REALTIME_EVENTS = {
  cafeteriaOrdersChanged: 'realtime:cafeteria-orders-changed',
  classroomsChanged: 'realtime:classrooms-changed',
  medicalChanged: 'realtime:medical-changed',
} as const;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
// The socket server is attached to the same HTTP server as the REST API,
// one level up from the versioned /api/v1 prefix.
const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

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
