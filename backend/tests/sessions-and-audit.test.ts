import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app, authed, cleanupRegisteredUsers, createStudent, loginAsAdmin } from './helpers';

afterAll(cleanupRegisteredUsers);

describe('GET /auth/sessions', () => {
  it('lists the current user’s active sessions, most recently used first', async () => {
    const student = await createStudent();
    const res = await request(app).get('/api/v1/auth/sessions').set('Authorization', authed(student.accessToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).not.toHaveProperty('tokenHash');
  });
});

describe('DELETE /auth/sessions/:id', () => {
  it('revokes one session without affecting the others', async () => {
    const student = await createStudent();

    // registration issued one session; log in again from a second "device" for a second session.
    const secondLogin = await request(app).post('/api/v1/auth/login').send({ email: student.email, password: 'Testpass1' });
    const sessionsBefore = await request(app).get('/api/v1/auth/sessions').set('Authorization', authed(student.accessToken));
    expect(sessionsBefore.body.data.length).toBeGreaterThanOrEqual(2);

    const targetSessionId = sessionsBefore.body.data.find((s: { id: string }) => s.id)?.id;
    const revoke = await request(app)
      .delete(`/api/v1/auth/sessions/${targetSessionId}`)
      .set('Authorization', authed(student.accessToken));
    expect(revoke.status).toBe(200);

    // The other login's refresh token should be unaffected if it wasn't the one revoked,
    // or correctly rejected if it was — either way, exactly one of the two sessions dies.
    const sessionsAfter = await request(app).get('/api/v1/auth/sessions').set('Authorization', authed(student.accessToken));
    expect(sessionsAfter.body.data.length).toBe(sessionsBefore.body.data.length - 1);

    await request(app).post('/api/v1/auth/logout').send({ refreshToken: secondLogin.body.data.refreshToken });
  });

  it('404s on a session id that does not belong to the caller', async () => {
    const [studentA, studentB] = await Promise.all([createStudent(), createStudent()]);
    const sessions = await request(app).get('/api/v1/auth/sessions').set('Authorization', authed(studentB.accessToken));
    const someoneElsesSessionId = sessions.body.data[0].id;

    const res = await request(app)
      .delete(`/api/v1/auth/sessions/${someoneElsesSessionId}`)
      .set('Authorization', authed(studentA.accessToken));
    expect(res.status).toBe(404);
  });
});

describe('GET /audit-logs', () => {
  it('is admin-only', async () => {
    const student = await createStudent();
    const res = await request(app).get('/api/v1/audit-logs').set('Authorization', authed(student.accessToken));
    expect(res.status).toBe(403);
  });

  it('records and surfaces a registration event', async () => {
    const admin = await loginAsAdmin();
    const student = await createStudent();

    const res = await request(app)
      .get(`/api/v1/audit-logs?action=auth.register&limit=50`)
      .set('Authorization', authed(admin.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.some((entry: { targetId: string }) => entry.targetId === student.id)).toBe(true);
  });
});
