import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { app, authed, cleanupRegisteredUsers, createStudent, loginAsAdmin, loginAsCafeteriaStaff } from './helpers';
import { prisma } from '../src/config/db';

const put = (token: string, body: object) => request(app).put('/api/v1/settings').set('Authorization', authed(token)).send(body);

afterAll(async () => {
  await prisma.campusSetting.deleteMany({
    where: { key: { in: ['securityPhone', 'cafeteriaOpensAt', 'cafeteriaClosesAt', 'maxBookingDaysAhead'] } },
  });
  await cleanupRegisteredUsers();
});

describe('settings', () => {
  it('is readable by any signed-in user and includes defaults', async () => {
    const student = await createStudent();
    const res = await request(app).get('/api/v1/settings').set('Authorization', authed(student.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ securityPhone: expect.any(String), maxBookingDaysAhead: expect.any(Number) });
  });

  it('forbids students, and limits staff to their own settings', async () => {
    const [student, staff] = await Promise.all([createStudent(), loginAsCafeteriaStaff()]);
    expect((await put(student.accessToken, { securityPhone: '100' })).status).toBe(403);
    expect((await put(staff.accessToken, { securityPhone: '100' })).status).toBe(403);
    expect((await put(staff.accessToken, { cafeteriaOpensAt: '08:00', cafeteriaClosesAt: '21:00' })).status).toBe(200);
  });

  it('lets an admin change a setting and everyone reads the new value', async () => {
    const [admin, student] = await Promise.all([loginAsAdmin(), createStudent()]);
    const phone = `+91 ${Math.floor(Math.random() * 1e9)}`;
    expect((await put(admin.accessToken, { securityPhone: phone })).status).toBe(200);
    const read = await request(app).get('/api/v1/settings').set('Authorization', authed(student.accessToken));
    expect(read.body.data.securityPhone).toBe(phone);
  });

  it('rejects unknown keys and half-set opening hours', async () => {
    const admin = await loginAsAdmin();
    expect((await put(admin.accessToken, { nonsense: 1 })).status).toBe(400);
    await put(admin.accessToken, { cafeteriaOpensAt: '', cafeteriaClosesAt: '' });
    expect((await put(admin.accessToken, { cafeteriaOpensAt: '09:00' })).status).toBe(400);
  });

  it('enforces opening hours on orders and the booking horizon on bookings', async () => {
    const [admin, student] = await Promise.all([loginAsAdmin(), createStudent()]);
    const item = await prisma.menuItem.create({ data: { name: `Hours Dish ${randomUUID().slice(0, 6)}`, price: 5, category: 'SNACKS' } });

    // A one-minute window that is not "now" means the kitchen is closed.
    const later = new Date(Date.now() + 3 * 3_600_000);
    const hh = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const opens = hh(later);
    const closes = hh(new Date(later.getTime() + 60_000));
    if (opens < closes) {
      await put(admin.accessToken, { cafeteriaOpensAt: opens, cafeteriaClosesAt: closes });
      const closed = await request(app)
        .post('/api/v1/cafeteria/orders')
        .set('Authorization', authed(student.accessToken))
        .send({ orderType: 'PICKUP', items: [{ menuItemId: item.id, quantity: 1 }] });
      expect(closed.status).toBe(400);
      expect(closed.body.message).toMatch(/closed/i);
      await put(admin.accessToken, { cafeteriaOpensAt: '', cafeteriaClosesAt: '' });
    }
    await prisma.menuItem.delete({ where: { id: item.id } });

    await put(admin.accessToken, { maxBookingDaysAhead: 1 });
    const room = await prisma.room.findFirst();
    if (room) {
      const start = new Date(Date.now() + 3 * 24 * 3_600_000);
      const far = await request(app)
        .post('/api/v1/classrooms/bookings')
        .set('Authorization', authed(student.accessToken))
        .send({ roomId: room.id, startTime: start.toISOString(), endTime: new Date(start.getTime() + 3_600_000).toISOString(), purpose: 'too far' });
      expect(far.status).toBe(400);
    }
  });
});
