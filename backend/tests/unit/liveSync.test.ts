import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Role } from '@prisma/client';

const emitAll = vi.fn();
const emitTo = vi.fn();
const to = vi.fn(() => ({ emit: emitTo }));
let initialized = true;

vi.mock('../../src/sockets/socket.server', () => ({
  getSocketIO: () => {
    if (!initialized) throw new Error('Socket.io has not been initialized yet');
    return { emit: emitAll, to };
  },
}));

import { publishChange } from '../../src/sockets/liveSync';
import { emitMenuChanged, emitReviewsChanged } from '../../src/modules/cafeteria/cafeteria.events';

beforeEach(() => {
  emitAll.mockClear();
  emitTo.mockClear();
  to.mockClear();
  initialized = true;
});

describe('publishChange', () => {
  it('broadcasts to everyone for public data', () => {
    publishChange('rooms', { all: true }, 'updated', ['r1']);
    expect(emitAll).toHaveBeenCalledWith('data:changed', { resource: 'rooms', action: 'updated', ids: ['r1'] });
    expect(to).not.toHaveBeenCalled();
  });

  it('targets the owner and the roles that may read private data, in one emit', () => {
    publishChange('bookings', { users: ['u1'], roles: [Role.ADMIN, Role.FACULTY] }, 'created', ['b1']);
    expect(emitAll).not.toHaveBeenCalled();
    expect(to).toHaveBeenCalledWith(['user-u1', 'role-ADMIN', 'role-FACULTY']);
    expect(emitTo).toHaveBeenCalledTimes(1);
    expect(emitTo).toHaveBeenCalledWith('data:changed', { resource: 'bookings', action: 'created', ids: ['b1'] });
  });

  it('skips missing user ids and sends nothing when nobody is addressed', () => {
    publishChange('users', { users: [undefined] });
    expect(to).not.toHaveBeenCalled();
    expect(emitAll).not.toHaveBeenCalled();
  });

  it('never throws when the socket server is not running', () => {
    initialized = false;
    expect(() => publishChange('menu', { all: true })).not.toThrow();
  });
});

describe('cafeteria events', () => {
  it('announce menu changes to everyone with the affected dishes', () => {
    emitMenuChanged(['a', 'b'], 'stock');
    expect(emitAll).toHaveBeenCalledWith('data:changed', { resource: 'menu', action: 'updated', ids: ['a', 'b'] });
  });

  it('report archiving as a deletion and creation as created', () => {
    emitMenuChanged(['a'], 'archived');
    emitMenuChanged(['b'], 'created');
    expect(emitAll).toHaveBeenNthCalledWith(1, 'data:changed', { resource: 'menu', action: 'deleted', ids: ['a'] });
    expect(emitAll).toHaveBeenNthCalledWith(2, 'data:changed', { resource: 'menu', action: 'created', ids: ['b'] });
  });

  it('announce review changes with the dish id', () => {
    emitReviewsChanged('a');
    expect(emitAll).toHaveBeenCalledWith('data:changed', { resource: 'reviews', action: 'updated', ids: ['a'] });
  });
});
