import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { app, authed, cleanupRegisteredUsers, createStudent, loginAsMedicalStaff } from './helpers';
import { prisma } from '../src/config/db';

let medicineId: string;
let rxMedicineId: string;

beforeAll(async () => {
  const [medicine, rxMedicine] = await Promise.all([
    prisma.medicine.create({ data: { name: `Test Medicine ${randomUUID().slice(0, 6)}`, price: 5, stock: 50 } }),
    prisma.medicine.create({
      data: { name: `Test Rx Medicine ${randomUUID().slice(0, 6)}`, price: 20, stock: 10, requiresPrescription: true },
    }),
  ]);
  medicineId = medicine.id;
  rxMedicineId = rxMedicine.id;
});

afterAll(async () => {
  await cleanupRegisteredUsers();
  await prisma.medicine.delete({ where: { id: medicineId } }).catch(() => undefined);
  await prisma.medicine.delete({ where: { id: rxMedicineId } }).catch(() => undefined);
});

describe('POST /medical-help/emergencies/trigger', () => {
  it('deduplicates a double-tap into a single incident', async () => {
    const student = await createStudent();
    const payload = { latitude: 12.34, longitude: 56.78, tag: 'FAINTED' };

    const first = await request(app).post('/api/v1/medical-help/emergencies/trigger').set('Authorization', authed(student.accessToken)).send(payload);
    const second = await request(app).post('/api/v1/medical-help/emergencies/trigger').set('Authorization', authed(student.accessToken)).send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.data.id).toBe(first.body.data.id);
  });

  it('leaves buildingId unset when reported far from every known building', async () => {
    const student = await createStudent();
    const res = await request(app)
      .post('/api/v1/medical-help/emergencies/trigger')
      .set('Authorization', authed(student.accessToken))
      .send({ latitude: -33.8688, longitude: 151.2093, tag: 'OTHER' }); // Sydney — nowhere near the seeded campus
    expect(res.status).toBe(201);
    expect(res.body.data.buildingId).toBeNull();
  });
});

describe('PATCH /medical-help/emergencies/:id/status — state machine', () => {
  it('rejects skipping straight from REPORTED to HANDLED', async () => {
    const [student, medicalStaff] = await Promise.all([createStudent(), loginAsMedicalStaff()]);
    const triggered = await request(app)
      .post('/api/v1/medical-help/emergencies/trigger')
      .set('Authorization', authed(student.accessToken))
      .send({ latitude: 1, longitude: 1, tag: 'INJURY' });

    const res = await request(app)
      .patch(`/api/v1/medical-help/emergencies/${triggered.body.data.id}/status`)
      .set('Authorization', authed(medicalStaff.accessToken))
      .send({ status: 'HANDLED' });
    expect(res.status).toBe(409);
  });

  it('allows the reporter to cancel their own emergency', async () => {
    const student = await createStudent();
    const triggered = await request(app)
      .post('/api/v1/medical-help/emergencies/trigger')
      .set('Authorization', authed(student.accessToken))
      .send({ latitude: 2, longitude: 2, tag: 'OTHER' });

    const res = await request(app)
      .patch(`/api/v1/medical-help/emergencies/${triggered.body.data.id}/status`)
      .set('Authorization', authed(student.accessToken))
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(200);
  });
});

describe('POST /medical-help/medicine-orders', () => {
  it('decrements stock and rejects ordering more than is in stock', async () => {
    const student = await createStudent();

    const tooMany = await request(app)
      .post('/api/v1/medical-help/medicine-orders')
      .set('Authorization', authed(student.accessToken))
      .send({ items: [{ medicineId, quantity: 9999 }] });
    expect(tooMany.status).toBe(409);

    const before = await prisma.medicine.findUniqueOrThrow({ where: { id: medicineId } });
    const ok = await request(app)
      .post('/api/v1/medical-help/medicine-orders')
      .set('Authorization', authed(student.accessToken))
      .send({ items: [{ medicineId, quantity: 3 }] });
    expect(ok.status).toBe(201);

    const after = await prisma.medicine.findUniqueOrThrow({ where: { id: medicineId } });
    expect(after.stock).toBe(before.stock - 3);
  });

  it('requires a prescription upload for a prescription-only medicine', async () => {
    const student = await createStudent();
    const res = await request(app)
      .post('/api/v1/medical-help/medicine-orders')
      .set('Authorization', authed(student.accessToken))
      .send({ items: [{ medicineId: rxMedicineId, quantity: 1 }] });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /medical-help/medicine-orders/:id/status — cancellation restocks', () => {
  it('returns the reserved stock when the owner cancels a PLACED order', async () => {
    const student = await createStudent();
    const before = await prisma.medicine.findUniqueOrThrow({ where: { id: medicineId } });

    const order = await request(app)
      .post('/api/v1/medical-help/medicine-orders')
      .set('Authorization', authed(student.accessToken))
      .send({ items: [{ medicineId, quantity: 2 }] });
    expect(order.status).toBe(201);

    const cancelled = await request(app)
      .patch(`/api/v1/medical-help/medicine-orders/${order.body.data.id}/status`)
      .set('Authorization', authed(student.accessToken))
      .send({ status: 'CANCELLED' });
    expect(cancelled.status).toBe(200);

    const after = await prisma.medicine.findUniqueOrThrow({ where: { id: medicineId } });
    expect(after.stock).toBe(before.stock);

    const again = await request(app)
      .patch(`/api/v1/medical-help/medicine-orders/${order.body.data.id}/status`)
      .set('Authorization', authed(student.accessToken))
      .send({ status: 'CANCELLED' });
    expect(again.status).toBe(409);
  });

  it('forbids a student from setting a non-cancel status', async () => {
    const student = await createStudent();
    const order = await request(app)
      .post('/api/v1/medical-help/medicine-orders')
      .set('Authorization', authed(student.accessToken))
      .send({ items: [{ medicineId, quantity: 1 }] });

    const res = await request(app)
      .patch(`/api/v1/medical-help/medicine-orders/${order.body.data.id}/status`)
      .set('Authorization', authed(student.accessToken))
      .send({ status: 'PREPARING' });
    expect(res.status).toBe(403);
  });
});
