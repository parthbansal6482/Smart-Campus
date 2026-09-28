import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { app, authed, cleanupRegisteredUsers, createStudent } from './helpers';

afterAll(cleanupRegisteredUsers);

describe('POST /uploads', () => {
  it('rejects a request with no file', async () => {
    const student = await createStudent();
    const res = await request(app).post('/api/v1/uploads').set('Authorization', authed(student.accessToken));
    expect(res.status).toBe(400);
  });

  it('rejects a disallowed file type', async () => {
    const student = await createStudent();
    const res = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', authed(student.accessToken))
      .attach('file', Buffer.from('not an image'), { filename: 'note.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });

  it('accepts an allowed image and returns a fetchable URL (local storage driver)', async () => {
    const student = await createStudent();
    const res = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', authed(student.accessToken))
      .attach('file', Buffer.from([0xff, 0xd8, 0xff]), { filename: 'photo.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.data.url).toContain('/uploads/');

    const key = res.body.data.url.split('/uploads/')[1];
    const savedPath = path.resolve(process.cwd(), 'uploads', key);
    expect(fs.existsSync(savedPath)).toBe(true);
    fs.unlinkSync(savedPath);
  });
});
