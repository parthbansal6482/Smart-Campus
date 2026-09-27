import request from 'supertest';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { createApp } from '../src/app';
import { prisma } from '../src/config/db';

export const app = createApp();

export const SEED_PASSWORD = 'Password@123';

interface AuthedUser {
  id: string;
  email: string;
  role: Role;
  accessToken: string;
  refreshToken: string;
}

const registeredEmails = new Set<string>();

/** Registers a brand-new STUDENT account with a unique email, so tests never collide with
 *  each other or with the seeded demo accounts. Tracked for cleanup in afterAllTests(). */
export const createStudent = async (): Promise<AuthedUser> => {
  const email = `test-${randomUUID()}@example.test`;
  registeredEmails.add(email);

  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Test Student', email, password: 'Testpass1', phone: '+1-555-0000' });

  if (res.status !== 201) {
    throw new Error(`Failed to create test student: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { ...res.body.data.user, accessToken: res.body.data.accessToken, refreshToken: res.body.data.refreshToken };
};

/** Logs in as one of the seeded demo accounts (see prisma/seed.ts). Used for roles that can't
 *  be self-registered (staff/faculty/admin) — creating throwaway staff accounts for every test
 *  run is possible via loginAsAdmin() + POST /users, but the seeded accounts are simpler when a
 *  test only needs "some" staff user rather than an isolated one. */
export const loginAs = async (email: string): Promise<AuthedUser> => {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: SEED_PASSWORD });
  if (res.status !== 200) {
    throw new Error(`Failed to log in as ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { ...res.body.data.user, accessToken: res.body.data.accessToken, refreshToken: res.body.data.refreshToken };
};

export const loginAsAdmin = () => loginAs('admin@smartcampus.edu');
export const loginAsFaculty = () => loginAs('faculty@smartcampus.edu');
export const loginAsMedicalStaff = () => loginAs('medical@smartcampus.edu');
export const loginAsCafeteriaStaff = () => loginAs('cafeteria@smartcampus.edu');

export const authed = (token: string) => `Bearer ${token}`;

/** Deletes every user this test run registered. Cascades take care of their bookings,
 *  orders, emergencies, etc. Call once from a top-level afterAll in each test file. */
export const cleanupRegisteredUsers = async () => {
  if (registeredEmails.size === 0) return;
  await prisma.user.deleteMany({ where: { email: { in: Array.from(registeredEmails) } } });
  registeredEmails.clear();
};

/** A short-lived building/room pair for tests that need to book or check availability
 *  without touching the seeded ENG/SCI rooms other tests (and manual testing) rely on. */
export const createTestRoom = async () => {
  const building = await prisma.building.create({
    data: {
      name: `Test Hall ${randomUUID().slice(0, 8)}`,
      code: `T${randomUUID().slice(0, 6).toUpperCase()}`,
      latitude: 0,
      longitude: 0,
    },
  });
  const room = await prisma.room.create({
    data: { buildingId: building.id, roomNumber: 'T-101', capacity: 20 },
  });
  return { building, room };
};

export const cleanupTestRoom = async (buildingId: string) => {
  // Room, bookings, and schedules cascade from the building delete.
  await prisma.building.delete({ where: { id: buildingId } }).catch(() => undefined);
};
