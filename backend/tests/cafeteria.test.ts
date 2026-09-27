import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { app, authed, cleanupRegisteredUsers, createStudent } from './helpers';
import { prisma } from '../src/config/db';

let menuItemId: string;

beforeAll(async () => {
  const item = await prisma.menuItem.create({
    data: { name: `Test Dish ${randomUUID().slice(0, 6)}`, price: 10, category: 'SNACKS' },
  });
  menuItemId = item.id;
});

afterAll(async () => {
  // Order first: this cascades away the orders (and their order items) that
  // reference the test menu item, so the item itself can then be deleted
  // without tripping its onDelete: Restrict foreign key.
  await cleanupRegisteredUsers();
  await prisma.menuItem.delete({ where: { id: menuItemId } }).catch(() => undefined);
});

describe('POST /cafeteria/orders', () => {
  it('merges duplicate line items for the same dish instead of rejecting the order', async () => {
    const student = await createStudent();
    const res = await request(app)
      .post('/api/v1/cafeteria/orders')
      .set('Authorization', authed(student.accessToken))
      .send({
        orderType: 'PICKUP',
        items: [
          { menuItemId, quantity: 1 },
          { menuItemId, quantity: 2 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.orderItems).toHaveLength(1);
    expect(res.body.data.orderItems[0].quantity).toBe(3);
    expect(res.body.data.totalAmount).toBe(30);
  });

  it('rejects an offer code that does not exist', async () => {
    const student = await createStudent();
    const res = await request(app)
      .post('/api/v1/cafeteria/orders')
      .set('Authorization', authed(student.accessToken))
      .send({ orderType: 'PICKUP', offerCode: 'NOT-A-REAL-CODE', items: [{ menuItemId, quantity: 1 }] });
    expect(res.status).toBe(400);
  });
});

describe('offer redemption limits', () => {
  it('honours maxRedemptions: the first order succeeds, the second is rejected', async () => {
    const [admin, studentA, studentB] = await Promise.all([
      request(app).post('/api/v1/auth/login').send({ email: 'admin@smartcampus.edu', password: 'Password@123' }),
      createStudent(),
      createStudent(),
    ]);
    const code = `TESTLIMIT${randomUUID().slice(0, 6).toUpperCase()}`;

    const created = await request(app)
      .post('/api/v1/cafeteria/offers')
      .set('Authorization', authed(admin.body.data.accessToken))
      .send({ title: 'Test limited offer', code, discountPercent: 10, maxRedemptions: 1 });
    expect(created.status).toBe(201);

    const first = await request(app)
      .post('/api/v1/cafeteria/orders')
      .set('Authorization', authed(studentA.accessToken))
      .send({ orderType: 'PICKUP', offerCode: code, items: [{ menuItemId, quantity: 1 }] });
    expect(first.status).toBe(201);
    expect(first.body.data.discountAmount).toBeGreaterThan(0);

    const second = await request(app)
      .post('/api/v1/cafeteria/orders')
      .set('Authorization', authed(studentB.accessToken))
      .send({ orderType: 'PICKUP', offerCode: code, items: [{ menuItemId, quantity: 1 }] });
    expect(second.status).toBe(400);

    await prisma.offer.delete({ where: { code } });
  });

  it('rejects an expired offer', async () => {
    const admin = await request(app).post('/api/v1/auth/login').send({ email: 'admin@smartcampus.edu', password: 'Password@123' });
    const student = await createStudent();
    const code = `TESTEXPIRED${randomUUID().slice(0, 6).toUpperCase()}`;

    await request(app)
      .post('/api/v1/cafeteria/offers')
      .set('Authorization', authed(admin.body.data.accessToken))
      .send({ title: 'Test expired offer', code, discountPercent: 10, expiresAt: '2020-01-01T00:00:00.000Z' });

    const res = await request(app)
      .post('/api/v1/cafeteria/orders')
      .set('Authorization', authed(student.accessToken))
      .send({ orderType: 'PICKUP', offerCode: code, items: [{ menuItemId, quantity: 1 }] });
    expect(res.status).toBe(400);

    await prisma.offer.delete({ where: { code } });
  });
});

describe('GET /cafeteria/orders/:id — ownership', () => {
  it('forbids a student from reading another student’s order', async () => {
    const [owner, other] = await Promise.all([createStudent(), createStudent()]);
    const order = await request(app)
      .post('/api/v1/cafeteria/orders')
      .set('Authorization', authed(owner.accessToken))
      .send({ orderType: 'PICKUP', items: [{ menuItemId, quantity: 1 }] });

    const res = await request(app)
      .get(`/api/v1/cafeteria/orders/${order.body.data.id}`)
      .set('Authorization', authed(other.accessToken));
    expect(res.status).toBe(403);
  });
});

describe('PATCH /cafeteria/orders/:id/status — cancellation window', () => {
  it('lets the owner cancel while still PLACED, but not after staff mark it PREPARING', async () => {
    const [cafeteriaStaff, student] = await Promise.all([
      request(app).post('/api/v1/auth/login').send({ email: 'cafeteria@smartcampus.edu', password: 'Password@123' }),
      createStudent(),
    ]);
    const order = await request(app)
      .post('/api/v1/cafeteria/orders')
      .set('Authorization', authed(student.accessToken))
      .send({ orderType: 'PICKUP', items: [{ menuItemId, quantity: 1 }] });

    await request(app)
      .patch(`/api/v1/cafeteria/orders/${order.body.data.id}/status`)
      .set('Authorization', authed(cafeteriaStaff.body.data.accessToken))
      .send({ status: 'PREPARING' });

    const res = await request(app)
      .patch(`/api/v1/cafeteria/orders/${order.body.data.id}/status`)
      .set('Authorization', authed(student.accessToken))
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(409);
  });
});
