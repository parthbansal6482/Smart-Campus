import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer, Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import { io as connect, Socket } from 'socket.io-client';
import { randomUUID } from 'crypto';
import { app, authed, cleanupRegisteredUsers, cleanupTestRoom, createStudent, createTestRoom, loginAsAdmin, loginAsCafeteriaStaff } from './helpers';
import { initSocketServer } from '../src/sockets/socket.server';
import { prisma } from '../src/config/db';

interface Change {
  resource: string;
  action: string;
  ids: string[];
}

let httpServer: HttpServer;
let url: string;
const sockets: Socket[] = [];

/** Connects a real socket.io client and records every `data:changed` it receives. */
const listen = async (token: string) => {
  const received: Change[] = [];
  const socket = connect(url, { auth: { token }, transports: ['websocket'] });
  sockets.push(socket);
  socket.on('data:changed', (c: Change) => received.push(c));
  await new Promise<void>((resolve, reject) => {
    socket.on('connect', () => resolve());
    socket.on('connect_error', reject);
  });
  return received;
};

const settle = () => new Promise(resolve => setTimeout(resolve, 400));

beforeAll(async () => {
  httpServer = createServer(app);
  initSocketServer(httpServer);
  await new Promise<void>(resolve => httpServer.listen(0, resolve));
  url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  sockets.forEach(s => s.disconnect());
  await new Promise(resolve => httpServer.close(resolve));
  await cleanupRegisteredUsers();
});

describe('live data sync over sockets', () => {
  it('sends a menu change to everyone signed in', async () => {
    const [staff, student] = await Promise.all([loginAsCafeteriaStaff(), createStudent()]);
    const seenByStudent = await listen(student.accessToken);

    const created = await request(app)
      .post('/api/v1/cafeteria/menu')
      .set('Authorization', authed(staff.accessToken))
      .send({ name: `Live Dish ${randomUUID().slice(0, 6)}`, price: 12, category: 'SNACKS' });
    expect(created.status).toBe(201);
    await settle();

    expect(seenByStudent).toContainEqual({ resource: 'menu', action: 'created', ids: [created.body.data.id] });
    await prisma.menuItem.delete({ where: { id: created.body.data.id } });
  });

  it('keeps private data private: a booking reaches its owner and admins, not other students', async () => {
    const [admin, owner, bystander] = await Promise.all([loginAsAdmin(), createStudent(), createStudent()]);
    const { building, room } = await createTestRoom();
    const [seenByAdmin, seenByOwner, seenByBystander] = await Promise.all([
      listen(admin.accessToken),
      listen(owner.accessToken),
      listen(bystander.accessToken),
    ]);

    const start = new Date(Date.now() + 2 * 3_600_000);
    const booking = await request(app)
      .post('/api/v1/classrooms/bookings')
      .set('Authorization', authed(owner.accessToken))
      .send({ roomId: room.id, startTime: start.toISOString(), endTime: new Date(start.getTime() + 3_600_000).toISOString(), purpose: 'Live sync test' });
    expect(booking.status).toBe(201);
    await settle();

    const bookingHint = { resource: 'bookings', action: 'created', ids: [booking.body.data.id] };
    expect(seenByAdmin).toContainEqual(bookingHint);
    expect(seenByOwner).toContainEqual(bookingHint);
    expect(seenByBystander.map(c => c.resource)).not.toContain('bookings');
    // Room availability is public, so the bystander still learns the room list changed.
    expect(seenByBystander).toContainEqual({ resource: 'rooms', action: 'updated', ids: [room.id] });

    await cleanupTestRoom(building.id);
  });

  it('tells an admin about a new sign-up, but not other students', async () => {
    const [admin, student] = await Promise.all([loginAsAdmin(), createStudent()]);
    const seenByAdmin = await listen(admin.accessToken);
    const seenByStudent = await listen(student.accessToken);

    const newcomer = await createStudent();
    await settle();

    expect(seenByAdmin).toContainEqual({ resource: 'users', action: 'created', ids: [newcomer.id] });
    expect(seenByStudent.map(c => c.resource)).not.toContain('users');
  });

  it('rejects a socket without a valid token', async () => {
    const socket = connect(url, { auth: { token: 'nope' }, transports: ['websocket'] });
    sockets.push(socket);
    const error = await new Promise<Error>(resolve => socket.on('connect_error', resolve));
    expect(error.message).toMatch(/token/i);
  });

  it('announces a settings change to everyone signed in', async () => {
    const [admin, student] = await Promise.all([loginAsAdmin(), createStudent()]);
    const seenByStudent = await listen(student.accessToken);

    const res = await request(app)
      .put('/api/v1/settings')
      .set('Authorization', authed(admin.accessToken))
      .send({ maxBookingDaysAhead: 30 });
    expect(res.status).toBe(200);
    await settle();

    expect(seenByStudent).toContainEqual({ resource: 'settings', action: 'updated', ids: ['maxBookingDaysAhead'] });
    await prisma.campusSetting.deleteMany({ where: { key: 'maxBookingDaysAhead' } });
  });

  it('puts a promoted user in their new role’s rooms and refuses a deactivated account', async () => {
    const [admin, student] = await Promise.all([loginAsAdmin(), createStudent()]);

    // Connect with auto-reconnect so the server-initiated disconnect on promotion is followed by a fresh handshake.
    const received: Change[] = [];
    const socket = connect(url, { auth: { token: student.accessToken }, transports: ['websocket'] });
    sockets.push(socket);
    socket.on('data:changed', (c: Change) => received.push(c));
    // Same as the real clients: a server-initiated disconnect is followed by an explicit reconnect.
    socket.on('disconnect', reason => {
      if (reason === 'io server disconnect') socket.connect();
    });
    await new Promise<void>(resolve => socket.on('connect', () => resolve()));

    await request(app)
      .patch(`/api/v1/users/${student.id}/role`)
      .set('Authorization', authed(admin.accessToken))
      .send({ role: 'FACULTY' });
    // Wait for the forced disconnect and the automatic reconnect.
    await new Promise(resolve => setTimeout(resolve, 2500));
    expect(socket.connected).toBe(true);
    received.length = 0;

    // Faculty receive booking hints; a plain student would not.
    const { building, room } = await createTestRoom();
    const owner = await createStudent();
    const start = new Date(Date.now() + 2 * 3_600_000);
    await request(app)
      .post('/api/v1/classrooms/bookings')
      .set('Authorization', authed(owner.accessToken))
      .send({ roomId: room.id, startTime: start.toISOString(), endTime: new Date(start.getTime() + 3_600_000).toISOString(), purpose: 'role rooms' });
    await settle();
    expect(received.map(c => c.resource)).toContain('bookings');
    await cleanupTestRoom(building.id);

    // Deactivation: the next handshake is refused.
    await request(app)
      .patch(`/api/v1/users/${student.id}/active`)
      .set('Authorization', authed(admin.accessToken))
      .send({ isActive: false });
    const refused = connect(url, { auth: { token: student.accessToken }, transports: ['websocket'], reconnection: false });
    sockets.push(refused);
    const error = await new Promise<Error>(resolve => refused.on('connect_error', resolve));
    expect(error.message).toMatch(/deactivated/i);
  });
});
