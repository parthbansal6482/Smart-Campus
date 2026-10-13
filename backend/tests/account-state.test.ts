import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app, authed, cleanupRegisteredUsers, createStudent, loginAsAdmin } from './helpers';

afterAll(cleanupRegisteredUsers);

describe('role and status changes apply to existing tokens immediately', () => {
  it('gives a promoted user their new permissions on the very next request', async () => {
    const [admin, student] = await Promise.all([loginAsAdmin(), createStudent()]);
    const stats = () => request(app).get('/api/v1/cafeteria/stats').set('Authorization', authed(student.accessToken));

    expect((await stats()).status).toBe(403);

    const promoted = await request(app)
      .patch(`/api/v1/users/${student.id}/role`)
      .set('Authorization', authed(admin.accessToken))
      .send({ role: 'CAFETERIA_STAFF' });
    expect(promoted.status).toBe(200);

    // Same access token as before the promotion.
    expect((await stats()).status).toBe(200);
  });

  it('locks a deactivated user out of API calls with the token they already hold', async () => {
    const [admin, student] = await Promise.all([loginAsAdmin(), createStudent()]);
    const me = () => request(app).get('/api/v1/auth/me').set('Authorization', authed(student.accessToken));

    expect((await me()).status).toBe(200);

    const off = await request(app)
      .patch(`/api/v1/users/${student.id}/active`)
      .set('Authorization', authed(admin.accessToken))
      .send({ isActive: false });
    expect(off.status).toBe(200);

    expect((await me()).status).toBe(401);
  });
});
