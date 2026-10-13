import { Role } from '@prisma/client';
import { getSocketIO } from './socket.server';

/**
 * Everything a client can display that another user or device may change.
 * Each name maps to the data a screen fetches over REST.
 */
export type SyncResource =
  | 'menu'
  | 'reviews'
  | 'rooms'
  | 'buildings'
  | 'schedules'
  | 'bookings'
  | 'emergencies'
  | 'medicines'
  | 'medicineOrders'
  | 'consultations'
  | 'users'
  | 'notifications'
  | 'settings';

export interface SyncAudience {
  /** Everyone signed in. Only for data every signed-in user can already read (menu, rooms, medicines...). */
  all?: boolean;
  /** Specific users, e.g. the owner of an order — every device they are signed in on. */
  users?: Array<string | undefined>;
  /** Everyone holding one of these roles, e.g. staff who can see all bookings. */
  roles?: Role[];
}

export const ADMINS: Role[] = [Role.ADMIN];
export const MEDICAL_ROLES: Role[] = [Role.MEDICAL_STAFF, Role.AMBULANCE_RESPONDER, Role.ADMIN];
export const PHARMACY_ROLES: Role[] = [Role.MEDICAL_STAFF, Role.ADMIN];
export const BOOKING_VIEWERS: Role[] = [Role.ADMIN, Role.FACULTY];

/**
 * Tells connected clients that `resource` changed so they refetch it.
 *
 * The message is only a hint — resource name, action and ids, never the record — so reaching
 * the wrong socket could not leak anything. Private data is still scoped to its owner and
 * the roles that may read it, and clients re-check permissions through the normal REST
 * endpoints when they refetch. A failed or missed broadcast is harmless: clients also refetch
 * when they reconnect and poll slowly as a fallback.
 */
export const publishChange = (
  resource: SyncResource,
  audience: SyncAudience,
  action: 'created' | 'updated' | 'deleted' = 'updated',
  ids: string[] = []
) => {
  try {
    const io = getSocketIO();
    const payload = { resource, action, ids };
    if (audience.all) {
      io.emit('data:changed', payload);
      return;
    }
    // One emit to a list of rooms delivers once per socket, even if it is in several of them.
    const rooms = [
      ...(audience.users ?? []).filter((u): u is string => !!u).map(u => `user-${u}`),
      ...(audience.roles ?? []).map(r => `role-${r}`),
    ];
    if (rooms.length > 0) io.to(rooms).emit('data:changed', payload);
  } catch {
    /* socket layer not initialized (e.g. tests) */
  }
};

/**
 * Drops every live connection of a user. Used when their role or status changes: clients reconnect
 * automatically, and the handshake re-reads the account, so they land in the rooms of their current
 * role (or are refused if the account was deactivated).
 */
export const disconnectUserSockets = (userId: string) => {
  try {
    getSocketIO().in(`user-${userId}`).disconnectSockets(true);
  } catch {
    /* socket layer not initialized (e.g. tests) */
  }
};
