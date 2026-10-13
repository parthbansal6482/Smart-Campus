import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { app, authed, cleanupRegisteredUsers, createStudent, loginAsCafeteriaStaff } from './helpers';
import { prisma } from '../src/config/db';

const tag = randomUUID().slice(0, 6);
let staffToken: string;
let tracked: { id: string };
let plain: { id: string };

beforeAll(async () => {
  staffToken = (await loginAsCafeteriaStaff()).accessToken;
  tracked = await prisma.menuItem.create({
    data: { name: `Stocked ${tag}`, price: 20, category: 'SNACKS', stock: 2, calories: 150, allergens: ['Dairy'] },
  });
  plain = await prisma.menuItem.create({ data: { name: `Plain ${tag}`, price: 10, category: 'SNACKS', calories: 900 } });
});

afterAll(async () => {
  await cleanupRegisteredUsers();
  await prisma.menuItem.deleteMany({ where: { id: { in: [tracked.id, plain.id] } } });
});

const order = (token: string, menuItemId: string, quantity = 1, extra: object = {}) =>
  request(app)
    .post('/api/v1/cafeteria/orders')
    .set('Authorization', authed(token))
    .send({ orderType: 'PICKUP', items: [{ menuItemId, quantity }], ...extra });

const setStatus = (token: string, id: string, status: string) =>
  request(app).patch(`/api/v1/cafeteria/orders/${id}/status`).set('Authorization', authed(token)).send({ status });

describe('stock', () => {
  it('claims stock on order, sells out at zero, and restores it on cancel', async () => {
    const student = await createStudent();
    const first = await order(student.accessToken, tracked.id, 2);
    expect(first.status).toBe(201);
    expect(await prisma.menuItem.findUnique({ where: { id: tracked.id } })).toMatchObject({ stock: 0, isAvailable: false });

    const soldOut = await order(student.accessToken, tracked.id, 1);
    expect(soldOut.status).toBe(400);

    const cancelled = await setStatus(student.accessToken, first.body.data.id, 'CANCELLED');
    expect(cancelled.status).toBe(200);
    expect(await prisma.menuItem.findUnique({ where: { id: tracked.id } })).toMatchObject({ stock: 2, isAvailable: true });
  });

  it('refuses more than the remaining portions', async () => {
    const student = await createStudent();
    const res = await order(student.accessToken, tracked.id, 3);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Only 2 left/);
  });
});

describe('order status flow', () => {
  it('lets staff move an order forward but not backward', async () => {
    const student = await createStudent();
    const placed = await order(student.accessToken, plain.id);
    const id = placed.body.data.id;

    expect((await setStatus(staffToken, id, 'PREPARING')).status).toBe(200);
    const back = await setStatus(staffToken, id, 'ACCEPTED');
    expect(back.status).toBe(409);
    expect((await setStatus(staffToken, id, 'READY')).status).toBe(200);
    expect((await setStatus(staffToken, id, 'COLLECTED')).status).toBe(200);
  });
});

describe('pickup time validation', () => {
  it('rejects a pickup time in the past', async () => {
    const student = await createStudent();
    const res = await order(student.accessToken, plain.id, 1, { pickupTime: new Date(Date.now() - 3_600_000).toISOString() });
    expect(res.status).toBe(400);
  });
});

describe('GET /cafeteria/menu filters', () => {
  it('filters by calories and excludes allergens case-insensitively', async () => {
    const lowCal = await request(app).get('/api/v1/cafeteria/menu').query({ search: tag, maxCalories: 200 });
    expect(lowCal.body.data.map((i: { id: string }) => i.id)).toEqual([tracked.id]);

    const noDairy = await request(app).get('/api/v1/cafeteria/menu').query({ search: tag, excludeAllergens: 'dairy' });
    expect(noDairy.body.data.map((i: { id: string }) => i.id)).toEqual([plain.id]);
  });

  it('sorts by price and rejects an unknown sort', async () => {
    const asc = await request(app).get('/api/v1/cafeteria/menu').query({ search: tag, sort: 'price_desc' });
    expect(asc.body.data.map((i: { id: string }) => i.id)).toEqual([tracked.id, plain.id]);
    expect((await request(app).get('/api/v1/cafeteria/menu').query({ sort: 'nope' })).status).toBe(400);
  });
});

describe('order history', () => {
  it('searches by order number and returns reorder lines with availability', async () => {
    const student = await createStudent();
    const placed = await order(student.accessToken, plain.id, 2);
    const { id, orderNumber } = placed.body.data;

    const found = await request(app)
      .get('/api/v1/cafeteria/orders')
      .set('Authorization', authed(student.accessToken))
      .query({ search: String(orderNumber) });
    expect(found.body.data.map((o: { id: string }) => o.id)).toEqual([id]);

    const none = await request(app)
      .get('/api/v1/cafeteria/orders')
      .set('Authorization', authed(student.accessToken))
      .query({ from: new Date(Date.now() + 86_400_000).toISOString() });
    expect(none.body.data).toHaveLength(0);

    const reorder = await request(app).get(`/api/v1/cafeteria/orders/${id}/reorder`).set('Authorization', authed(student.accessToken));
    expect(reorder.status).toBe(200);
    expect(reorder.body.data).toHaveLength(1);
    expect(reorder.body.data[0]).toMatchObject({ quantity: 2, available: true, previousUnitPrice: 10 });
  });
});

describe('reviews', () => {
  it('only lets customers who collected the dish review it, and updates the average', async () => {
    const student = await createStudent();
    const tooEarly = await request(app)
      .put(`/api/v1/cafeteria/menu/${plain.id}/reviews/mine`)
      .set('Authorization', authed(student.accessToken))
      .send({ rating: 4 });
    expect(tooEarly.status).toBe(403);

    const placed = await order(student.accessToken, plain.id);
    await setStatus(staffToken, placed.body.data.id, 'COLLECTED');

    const review = await request(app)
      .put(`/api/v1/cafeteria/menu/${plain.id}/reviews/mine`)
      .set('Authorization', authed(student.accessToken))
      .send({ rating: 2, comment: 'Meh' });
    expect(review.status).toBe(200);
    expect(await prisma.menuItem.findUnique({ where: { id: plain.id } })).toMatchObject({ rating: 2, reviewCount: 1 });

    // Re-submitting edits the same review rather than adding another.
    await request(app)
      .put(`/api/v1/cafeteria/menu/${plain.id}/reviews/mine`)
      .set('Authorization', authed(student.accessToken))
      .send({ rating: 5 });
    const list = await request(app).get(`/api/v1/cafeteria/menu/${plain.id}/reviews`);
    expect(list.body.data.reviews).toHaveLength(1);
    expect(list.body.data.distribution[5]).toBe(1);
    expect(await prisma.menuItem.findUnique({ where: { id: plain.id } })).toMatchObject({ rating: 5, reviewCount: 1 });

    const removed = await request(app).delete(`/api/v1/cafeteria/menu/${plain.id}/reviews/mine`).set('Authorization', authed(student.accessToken));
    expect(removed.status).toBe(200);
    expect(await prisma.menuItem.findUnique({ where: { id: plain.id } })).toMatchObject({ rating: 4.5, reviewCount: 0 });
  });
});

describe('GET /cafeteria/stats', () => {
  it('is staff-only and reports today and the 7-day trend', async () => {
    const student = await createStudent();
    expect((await request(app).get('/api/v1/cafeteria/stats').set('Authorization', authed(student.accessToken))).status).toBe(403);

    const res = await request(app).get('/api/v1/cafeteria/stats').set('Authorization', authed(staffToken));
    expect(res.status).toBe(200);
    expect(res.body.data.trend).toHaveLength(7);
    expect(res.body.data.today).toHaveProperty('revenue');
    expect(Array.isArray(res.body.data.topItems)).toBe(true);
  });
});

describe('review moderation', () => {
  it('lets staff remove a customer review, and nobody else', async () => {
    const [student, other] = await Promise.all([createStudent(), createStudent()]);
    const placed = await order(student.accessToken, plain.id);
    await setStatus(staffToken, placed.body.data.id, 'COLLECTED');
    const review = await request(app)
      .put(`/api/v1/cafeteria/menu/${plain.id}/reviews/mine`)
      .set('Authorization', authed(student.accessToken))
      .send({ rating: 1, comment: 'rude text' });
    expect(review.status).toBe(200);

    const url = `/api/v1/cafeteria/menu/${plain.id}/reviews/${review.body.data.id}`;
    expect((await request(app).delete(url).set('Authorization', authed(other.accessToken))).status).toBe(403);
    expect((await request(app).delete(url).set('Authorization', authed(staffToken))).status).toBe(200);
    expect(await prisma.menuItem.findUnique({ where: { id: plain.id } })).toMatchObject({ rating: 4.5, reviewCount: 0 });
  });
});

describe('removed dishes', () => {
  it('are hidden from customers, listed for staff, and can be restored', async () => {
    const student = await createStudent();
    const removed = await request(app).delete(`/api/v1/cafeteria/menu/${plain.id}`).set('Authorization', authed(staffToken));
    expect(removed.status).toBe(200);

    const ids = (res: request.Response) => res.body.data.map((i: { id: string }) => i.id);
    const asStudent = await request(app)
      .get('/api/v1/cafeteria/menu')
      .set('Authorization', authed(student.accessToken))
      .query({ search: tag, includeArchived: 'true' });
    expect(ids(asStudent)).not.toContain(plain.id);

    const asStaff = await request(app)
      .get('/api/v1/cafeteria/menu')
      .set('Authorization', authed(staffToken))
      .query({ search: tag, includeArchived: 'true' });
    expect(ids(asStaff)).toContain(plain.id);

    const restored = await request(app)
      .patch(`/api/v1/cafeteria/menu/${plain.id}`)
      .set('Authorization', authed(staffToken))
      .send({ isArchived: false, isAvailable: true });
    expect(restored.status).toBe(200);
    const after = await request(app).get('/api/v1/cafeteria/menu').query({ search: tag });
    expect(ids(after)).toContain(plain.id);
  });
});
