import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app, authed, cleanupRegisteredUsers, createStudent, loginAsAdmin } from './helpers';

afterAll(cleanupRegisteredUsers);

describe('GET /users/:id — ownership', () => {
  it('lets a user read their own profile', async () => {
    const student = await createStudent();
    const res = await request(app).get(`/api/v1/users/${student.id}`).set('Authorization', authed(student.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(student.id);
  });

  it('forbids a user from reading someone else’s profile (IDOR)', async () => {
    const [studentA, studentB] = await Promise.all([createStudent(), createStudent()]);
    const res = await request(app).get(`/api/v1/users/${studentB.id}`).set('Authorization', authed(studentA.accessToken));
    expect(res.status).toBe(403);
  });

  it('lets an admin read any profile', async () => {
    const [admin, student] = await Promise.all([loginAsAdmin(), createStudent()]);
    const res = await request(app).get(`/api/v1/users/${student.id}`).set('Authorization', authed(admin.accessToken));
    expect(res.status).toBe(200);
  });
});

describe('GET /users — admin only, paginated', () => {
  it('forbids a non-admin', async () => {
    const student = await createStudent();
    const res = await request(app).get('/api/v1/users').set('Authorization', authed(student.accessToken));
    expect(res.status).toBe(403);
  });

  it('returns a paginated shape for an admin', async () => {
    const admin = await loginAsAdmin();
    const res = await request(app).get('/api/v1/users?limit=2').set('Authorization', authed(admin.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.meta).toMatchObject({ limit: 2 });
  });
});

describe('PATCH /users/:id/role', () => {
  it('refuses to let an admin change their own role', async () => {
    const admin = await loginAsAdmin();
    const res = await request(app)
      .patch(`/api/v1/users/${admin.id}/role`)
      .set('Authorization', authed(admin.accessToken))
      .send({ role: 'STUDENT' });
    expect(res.status).toBe(409);
  });

  it('forbids a non-admin from changing anyone’s role', async () => {
    const [studentA, studentB] = await Promise.all([createStudent(), createStudent()]);
    const res = await request(app)
      .patch(`/api/v1/users/${studentB.id}/role`)
      .set('Authorization', authed(studentA.accessToken))
      .send({ role: 'ADMIN' });
    expect(res.status).toBe(403);
  });
});

describe('PUT /users/me/push-token', () => {
  it('saves and clears an Expo push token', async () => {
    const student = await createStudent();

    const save = await request(app)
      .put('/api/v1/users/me/push-token')
      .set('Authorization', authed(student.accessToken))
      .send({ expoPushToken: 'ExponentPushToken[test-token]' });
    expect(save.status).toBe(200);

    const clear = await request(app)
      .put('/api/v1/users/me/push-token')
      .set('Authorization', authed(student.accessToken))
      .send({ expoPushToken: null });
    expect(clear.status).toBe(200);
  });
});
