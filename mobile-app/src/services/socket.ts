import { io, Socket } from 'socket.io-client';
import { tokenStorage, API_BASE_URL } from './api';
import { realtimeEvents, REALTIME_EVENTS } from './realtimeEvents';

// The socket server is attached to the same HTTP server as the REST API,
// one level up from the versioned /api/v1 prefix.
const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

/**
 * Opens the realtime connection for the current session. The backend
 * authenticates the handshake itself and derives room membership from the
 * token's role — this client never declares which broadcast rooms it's in.
 * Backend events are re-emitted on realtimeEvents so screens can subscribe
 * without holding a reference to the socket instance itself.
 */
export const connectSocket = async (): Promise<Socket | null> => {
  const token = await tokenStorage.getAccessToken();
  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('notification:new', (notification: { type?: string }) => {
    realtimeEvents.emit('notification', notification);
    if (notification.type === 'EMERGENCY' || notification.type === 'CONSULTATION' || notification.type === 'MEDICINE_ORDER') {
      realtimeEvents.emit(REALTIME_EVENTS.medicalChanged);
    } else if (notification.type === 'ORDER') {
      realtimeEvents.emit(REALTIME_EVENTS.cafeteriaOrdersChanged);
    }
  });

  socket.on('order:new', () => realtimeEvents.emit(REALTIME_EVENTS.cafeteriaOrdersChanged));
  socket.on('order:status_updated', () => realtimeEvents.emit(REALTIME_EVENTS.cafeteriaOrdersChanged));
  socket.on('classroom:occupancy_updated', () => realtimeEvents.emit(REALTIME_EVENTS.classroomsChanged));
  socket.on('classroom:list_updated', () => realtimeEvents.emit(REALTIME_EVENTS.classroomsChanged));

  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
