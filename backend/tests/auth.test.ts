import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { app, authed, cleanupRegisteredUsers, loginAsAdmin, SEED_PASSWORD } from './helpers';

afterAll(cleanupRegisteredUsers);

describe('POST /auth/register', () => {
  it('ignores a client-supplied role and always creates a STUDENT', async () => {
    const email = `test-${randomUUID()}@example.test`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Eve Hacker', email, password: 'Testpass1', role: 'ADMIN' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('STUDENT');

    const { prisma } = await import('../src/config/db');
    await prisma.user.delete({ where: { email } });
  });

  it('rejects a password without a number', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Bad Password', email: `test-${randomUUID()}@example.test`, password: 'nonumbershere' });
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  it('returns an access/refresh token pair and never the raw password hash', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@smartcampus.edu', password: SEED_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTypeOf('string');
    expect(res.body.data.refreshToken).toBeTypeOf('string');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects a wrong password with the same message as an unknown email (no enumeration)', async () => {
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@smartcampus.edu', password: 'definitely-wrong' });
    const unknownEmail = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: `nobody-${randomUUID()}@example.test`, password: 'whatever123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });
});

describe('email normalization', () => {
  it('treats emails case-insensitively: a mixed-case signup can log in with any casing', async () => {
    const local = `test-${randomUUID()}`;
    const lower = `${local}@example.test`;
    // The tracked cleanup list holds the lowercased address the API stores.
    const registered = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Mixed Case', email: `  ${local.toUpperCase()}@Example.Test `, password: 'Testpass1' });
    expect(registered.status).toBe(201);
    expect(registered.body.data.user.email).toBe(lower);

    const login = await request(app).post('/api/v1/auth/login').send({ email: lower.toUpperCase(), password: 'Testpass1' });
    expect(login.status).toBe(200);

    const duplicate = await request(app).post('/api/v1/auth/register').send({ name: 'Dup', email: lower, password: 'Testpass1' });
    expect(duplicate.status).toBe(409);

    const { prisma } = await import('../src/config/db');
    await prisma.user.delete({ where: { email: lower } });
  });
});

describe('POST /auth/refresh', () => {
  it('rotates the refresh token and rejects the old one on reuse', async () => {
    const admin = await loginAsAdmin();

    const refreshed = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: admin.refreshToken });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.refreshToken).not.toBe(admin.refreshToken);

    const reused = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: admin.refreshToken });
    expect(reused.status).toBe(401);

    // Clean up the still-valid rotated token so it doesn't linger in /auth/sessions.
    await request(app).post('/api/v1/auth/logout').send({ refreshToken: refreshed.body.data.refreshToken });
  });

  it('rejects a garbage refresh token', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'not-a-real-token' });
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('revokes the refresh token server-side, not just locally', async () => {
    const admin = await loginAsAdmin();

    const logoutRes = await request(app).post('/api/v1/auth/logout').send({ refreshToken: admin.refreshToken });
    expect(logoutRes.status).toBe(200);

    const reused = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: admin.refreshToken });
    expect(reused.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the caller’s own profile for a valid token', async () => {
    const admin = await loginAsAdmin();
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', authed(admin.accessToken));
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('admin@smartcampus.edu');
  });
});
