import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import { app, authed, cleanupRegisteredUsers, cleanupTestRoom, createStudent, createTestRoom, loginAsAdmin } from './helpers';

let building: { id: string };
let room: { id: string; roomNumber: string };

beforeAll(async () => {
  ({ building, room } = await createTestRoom());
});

afterAll(async () => {
  await cleanupTestRoom(building.id);
  await cleanupRegisteredUsers();
});

const inFuture = (hoursFromNow: number) => new Date(Date.now() + hoursFromNow * 3600_000).toISOString();

describe('POST /classrooms/bookings', () => {
  it('books a free room and rejects an overlapping booking for the same room', async () => {
    const student = await createStudent();

    const first = await request(app)
      .post('/api/v1/classrooms/bookings')
      .set('Authorization', authed(student.accessToken))
      .send({ roomId: room.id, startTime: inFuture(48), endTime: inFuture(49), purpose: 'Study session' });
    expect(first.status).toBe(201);

    const overlapping = await request(app)
      .post('/api/v1/classrooms/bookings')
      .set('Authorization', authed(student.accessToken))
      .send({ roomId: room.id, startTime: inFuture(48.5), endTime: inFuture(49.5), purpose: 'Another session' });
    expect(overlapping.status).toBe(409);
  });

  it('rejects a start time in the past', async () => {
    const student = await createStudent();
    const res = await request(app)
      .post('/api/v1/classrooms/bookings')
      .set('Authorization', authed(student.accessToken))
      .send({ roomId: room.id, startTime: inFuture(-1), endTime: inFuture(1), purpose: 'Time travel' });
    expect(res.status).toBe(400);
  });

  it('rejects a booking longer than the maximum duration', async () => {
    const student = await createStudent();
    const res = await request(app)
      .post('/api/v1/classrooms/bookings')
      .set('Authorization', authed(student.accessToken))
      .send({ roomId: room.id, startTime: inFuture(72), endTime: inFuture(72 + 8), purpose: 'All day' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /classrooms/bookings/:id/status — ownership', () => {
  it('lets the owner cancel their own booking', async () => {
    const student = await createStudent();
    const created = await request(app)
      .post('/api/v1/classrooms/bookings')
      .set('Authorization', authed(student.accessToken))
      .send({ roomId: room.id, startTime: inFuture(96), endTime: inFuture(97), purpose: 'To be cancelled' });

    const cancelled = await request(app)
      .patch(`/api/v1/classrooms/bookings/${created.body.data.id}/status`)
      .set('Authorization', authed(student.accessToken))
      .send({ status: 'CANCELLED' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe('CANCELLED');
  });

  it('forbids cancelling someone else’s booking', async () => {
    const [owner, other] = await Promise.all([createStudent(), createStudent()]);
    const created = await request(app)
      .post('/api/v1/classrooms/bookings')
      .set('Authorization', authed(owner.accessToken))
      .send({ roomId: room.id, startTime: inFuture(120), endTime: inFuture(121), purpose: 'Owned by A' });

    const res = await request(app)
      .patch(`/api/v1/classrooms/bookings/${created.body.data.id}/status`)
      .set('Authorization', authed(other.accessToken))
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(403);
  });
});

describe('GET /classrooms/rooms/available', () => {
  it('excludes a room that has a recurring class scheduled during the window', async () => {
    const admin = await loginAsAdmin();

    // Thursday (dayOfWeek 4), 10:00–11:00.
    const schedule = await request(app)
      .post('/api/v1/classrooms/schedules')
      .set('Authorization', authed(admin.accessToken))
      .send({ roomId: room.id, dayOfWeek: 4, startMinute: 600, endMinute: 660, courseName: 'Test Lecture' });
    expect(schedule.status).toBe(201);

    const nextThursday = new Date();
    nextThursday.setDate(nextThursday.getDate() + ((4 + 7 - nextThursday.getDay()) % 7 || 7));
    nextThursday.setHours(10, 30, 0, 0);
    const windowStart = nextThursday.toISOString();
    const windowEnd = new Date(nextThursday.getTime() + 3600_000).toISOString();

    const available = await request(app)
      .get(`/api/v1/classrooms/rooms/available?startTime=${windowStart}&endTime=${windowEnd}&buildingId=${building.id}`)
      .set('Authorization', authed(admin.accessToken));

    expect(available.status).toBe(200);
    expect(available.body.data.find((r: { id: string }) => r.id === room.id)).toBeUndefined();

    await request(app).delete(`/api/v1/classrooms/schedules/${schedule.body.data.id}`).set('Authorization', authed(admin.accessToken));
  });
});

describe('PATCH /classrooms/schedules/:id', () => {
  it('updates a schedule and rejects an invalid time range', async () => {
    const admin = await loginAsAdmin();
    const created = await request(app)
      .post('/api/v1/classrooms/schedules')
      .set('Authorization', authed(admin.accessToken))
      .send({ roomId: room.id, dayOfWeek: 2, startMinute: 60, endMinute: 120 });

    const updated = await request(app)
      .patch(`/api/v1/classrooms/schedules/${created.body.data.id}`)
      .set('Authorization', authed(admin.accessToken))
      .send({ startMinute: 90, endMinute: 150 });
    expect(updated.status).toBe(200);
    expect(updated.body.data.startMinute).toBe(90);

    const invalid = await request(app)
      .patch(`/api/v1/classrooms/schedules/${created.body.data.id}`)
      .set('Authorization', authed(admin.accessToken))
      .send({ startMinute: 200, endMinute: 100 });
    expect(invalid.status).toBe(400);

    await request(app).delete(`/api/v1/classrooms/schedules/${created.body.data.id}`).set('Authorization', authed(admin.accessToken));
  });

  it('forbids a non-admin from updating a schedule', async () => {
    const [admin, student] = await Promise.all([loginAsAdmin(), createStudent()]);
    const created = await request(app)
      .post('/api/v1/classrooms/schedules')
      .set('Authorization', authed(admin.accessToken))
      .send({ roomId: room.id, dayOfWeek: 3, startMinute: 60, endMinute: 120 });

    const res = await request(app)
      .patch(`/api/v1/classrooms/schedules/${created.body.data.id}`)
      .set('Authorization', authed(student.accessToken))
      .send({ courseName: 'Hacked' });
    expect(res.status).toBe(403);

    await request(app).delete(`/api/v1/classrooms/schedules/${created.body.data.id}`).set('Authorization', authed(admin.accessToken));
  });
});
