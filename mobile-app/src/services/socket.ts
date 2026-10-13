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
  // Checked after the await so concurrent callers can't both open a socket;
  // also covers one that is still connecting/reconnecting.
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    // A callback so every (re)connect uses the current access token rather
    // than the one captured at first connect, which may have since expired.
    auth: cb => {
      tokenStorage.getAccessToken().then(fresh => cb({ token: fresh }));
    },
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

  // The server announces which kind of data changed (menu, rooms, bookings, emergencies, users...);
  // screens subscribe to the matching event and refetch what they show.
  socket.on('data:changed', (change: { resource: string; ids?: string[] }) => {
    const { resource, ids = [] } = change;
    switch (resource) {
      case 'menu':
        realtimeEvents.emit(REALTIME_EVENTS.cafeteriaMenuChanged);
        break;
      case 'reviews':
        realtimeEvents.emit(REALTIME_EVENTS.menuReviewsChanged, ids[0]);
        realtimeEvents.emit(REALTIME_EVENTS.cafeteriaMenuChanged);
        break;
      case 'rooms':
      case 'buildings':
      case 'schedules':
        realtimeEvents.emit(REALTIME_EVENTS.classroomsChanged);
        break;
      case 'bookings':
        realtimeEvents.emit(REALTIME_EVENTS.bookingsChanged);
        realtimeEvents.emit(REALTIME_EVENTS.classroomsChanged);
        break;
      case 'emergencies':
      case 'consultations':
      case 'medicineOrders':
      case 'medicines':
        realtimeEvents.emit(REALTIME_EVENTS.medicalChanged);
        break;
      case 'users':
        realtimeEvents.emit(REALTIME_EVENTS.usersChanged, ids);
        break;
      case 'notifications':
        realtimeEvents.emit(REALTIME_EVENTS.notificationsChanged);
        break;
      case 'settings':
        realtimeEvents.emit(REALTIME_EVENTS.settingsChanged);
        break;
    }
  });

  // Events can be missed while offline: when the socket (re)connects, refetch everything.
  socket.on('connect', () => {
    realtimeEvents.emit(REALTIME_EVENTS.cafeteriaOrdersChanged);
    realtimeEvents.emit(REALTIME_EVENTS.cafeteriaMenuChanged);
    realtimeEvents.emit(REALTIME_EVENTS.menuReviewsChanged);
    realtimeEvents.emit(REALTIME_EVENTS.classroomsChanged);
    realtimeEvents.emit(REALTIME_EVENTS.medicalChanged);
    realtimeEvents.emit(REALTIME_EVENTS.bookingsChanged);
    realtimeEvents.emit(REALTIME_EVENTS.usersChanged, []);
    realtimeEvents.emit(REALTIME_EVENTS.notificationsChanged);
    realtimeEvents.emit(REALTIME_EVENTS.settingsChanged);
  });

  // The server drops our connection when our role or status changes (so rooms are re-derived).
  // socket.io doesn't retry that kind of disconnect by itself, so reconnect explicitly.
  socket.on('disconnect', reason => {
    if (reason === 'io server disconnect') socket?.connect();
  });

  // The server refuses the handshake for a deactivated account: sign out instead of retrying forever.
  socket.on('connect_error', (error: Error) => {
    if (/deactivated/i.test(error.message)) realtimeEvents.emit('account-deactivated');
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
