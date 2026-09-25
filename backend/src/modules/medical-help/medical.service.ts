import { EmergencyStatus, EmergencyTag, MedicineCategory, MedicineOrderStatus, ConsultationType, ConsultationStatus, Role } from '@prisma/client';
import { prisma } from '../../config/db';
import { config } from '../../config';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { calculateDistanceMeters } from '../../utils/geo';
import { notifyRoles, notifyUser } from '../../services/notification.service';
import { recordAudit } from '../../utils/audit';

// A double-tap or a flaky connection retry shouldn't create two separate
// incidents for the same emergency — if this user already has an active
// alert reported in the last minute, we treat a new trigger as the same one.
const DEDUPE_WINDOW_MS = 60_000;

const emergencyInclude = {
  user: { select: { id: true, name: true, phone: true, email: true } },
  building: true,
} as const;

const ACTIVE_EMERGENCY_STATUSES: EmergencyStatus[] = [
  EmergencyStatus.REPORTED,
  EmergencyStatus.ASSIGNED,
  EmergencyStatus.ON_THE_WAY,
  EmergencyStatus.ARRIVED,
];

const RESPONDER_ROLES: Role[] = [Role.MEDICAL_STAFF, Role.AMBULANCE_RESPONDER, Role.ADMIN];

const ALLOWED_TRANSITIONS: Record<EmergencyStatus, EmergencyStatus[]> = {
  REPORTED: [EmergencyStatus.ASSIGNED, EmergencyStatus.CANCELLED],
  ASSIGNED: [EmergencyStatus.ON_THE_WAY, EmergencyStatus.CANCELLED],
  ON_THE_WAY: [EmergencyStatus.ARRIVED, EmergencyStatus.CANCELLED],
  ARRIVED: [EmergencyStatus.HANDLED, EmergencyStatus.CANCELLED],
  HANDLED: [],
  CANCELLED: [],
};

export class MedicalService {
  // --- EMERGENCY TRACK ---
  async getActiveEmergencies() {
    return prisma.emergency.findMany({
      where: { status: { in: ACTIVE_EMERGENCY_STATUSES } },
      include: emergencyInclude,
      orderBy: { reportedAt: 'desc' },
    });
  }

  async getAllEmergencies(params: { userId?: string; skip: number; take: number }) {
    const where = params.userId ? { userId: params.userId } : undefined;
    const [emergencies, total] = await prisma.$transaction([
      prisma.emergency.findMany({ where, include: emergencyInclude, orderBy: { reportedAt: 'desc' }, skip: params.skip, take: params.take }),
      prisma.emergency.count({ where }),
    ]);
    return { emergencies, total };
  }

  async triggerEmergency(
    userId: string,
    data: { latitude: number; longitude: number; buildingId?: string; locationDetail?: string; tag?: EmergencyTag; description?: string }
  ) {
    const recentDuplicate = await prisma.emergency.findFirst({
      where: {
        userId,
        status: { in: ACTIVE_EMERGENCY_STATUSES },
        reportedAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
      },
      include: emergencyInclude,
      orderBy: { reportedAt: 'desc' },
    });
    if (recentDuplicate) {
      return recentDuplicate;
    }

    let resolvedBuildingId = data.buildingId;

    if (!resolvedBuildingId) {
      const buildings = await prisma.building.findMany();
      let nearest: (typeof buildings)[number] | null = null;
      let minDistance = Infinity;

      for (const b of buildings) {
        const dist = calculateDistanceMeters(data.latitude, data.longitude, b.latitude, b.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = b;
        }
      }

      // Only auto-attach a building if the report is plausibly inside it —
      // otherwise leave it unmatched rather than pointing responders at the
      // wrong building.
      if (nearest && minDistance <= config.campus.buildingMatchRadiusMeters) {
        resolvedBuildingId = nearest.id;
      }
    }

    const emergency = await prisma.emergency.create({
      data: {
        userId,
        latitude: data.latitude,
        longitude: data.longitude,
        buildingId: resolvedBuildingId,
        locationDetail: data.locationDetail,
        tag: data.tag || EmergencyTag.OTHER,
        description: data.description,
        status: EmergencyStatus.REPORTED,
      },
      include: emergencyInclude,
    });

    await notifyRoles([Role.MEDICAL_STAFF, Role.AMBULANCE_RESPONDER, Role.ADMIN], {
      type: 'EMERGENCY',
      title: 'New emergency reported',
      body: `${emergency.user.name} needs help${emergency.building ? ` near ${emergency.building.name}` : ''}`,
      data: { emergencyId: emergency.id },
    });

    await recordAudit({ actorId: userId, action: 'emergency.trigger', targetType: 'Emergency', targetId: emergency.id });

    return emergency;
  }

  async updateEmergencyStatus(id: string, status: EmergencyStatus, responderId: string | undefined, actor: { userId: string; role: Role }) {
    const emergency = await prisma.emergency.findUnique({ where: { id } });
    if (!emergency) throw new NotFoundError('Emergency incident not found');

    const isReporter = emergency.userId === actor.userId;
    const isResponder = RESPONDER_ROLES.includes(actor.role);

    if (status === EmergencyStatus.CANCELLED) {
      if (!isReporter && !isResponder) {
        throw new ForbiddenError('You cannot cancel this incident');
      }
    } else if (!isResponder) {
      throw new ForbiddenError('Only medical staff or responders can update this status');
    }

    const allowedNext = ALLOWED_TRANSITIONS[emergency.status];
    if (!allowedNext.includes(status)) {
      throw new ConflictError(`Cannot move an emergency from ${emergency.status} to ${status}`);
    }

    const updated = await prisma.emergency.update({
      where: { id },
      data: {
        status,
        responderId: responderId || (isResponder ? actor.userId : emergency.responderId),
        acknowledgedAt: emergency.acknowledgedAt ?? (status === EmergencyStatus.ASSIGNED ? new Date() : undefined),
        resolvedAt: status === EmergencyStatus.HANDLED || status === EmergencyStatus.CANCELLED ? new Date() : null,
      },
      include: emergencyInclude,
    });

    await notifyUser({
      userId: emergency.userId,
      type: 'EMERGENCY',
      title: 'Update on your emergency alert',
      body: `Status: ${status.replace(/_/g, ' ').toLowerCase()}`,
      data: { emergencyId: id, status },
    });

    await recordAudit({
      actorId: actor.userId,
      action: 'emergency.status_change',
      targetType: 'Emergency',
      targetId: id,
      metadata: { from: emergency.status, to: status },
    });

    return updated;
  }

  // --- MEDICINE STORE TRACK ---
  async getMedicines(category?: MedicineCategory, search?: string) {
    return prisma.medicine.findMany({
      where: {
        isArchived: false,
        category: category || undefined,
        name: search ? { contains: search, mode: 'insensitive' } : undefined,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createMedicine(data: {
    name: string;
    category: MedicineCategory;
    price: number;
    description?: string;
    stock: number;
    requiresPrescription: boolean;
    imageUrl?: string;
  }) {
    return prisma.medicine.create({ data });
  }

  async updateMedicine(
    id: string,
    data: Partial<{
      name: string;
      category: MedicineCategory;
      price: number;
      description: string;
      stock: number;
      requiresPrescription: boolean;
      imageUrl: string;
      isArchived: boolean;
    }>
  ) {
    const medicine = await prisma.medicine.findUnique({ where: { id } });
    if (!medicine) throw new NotFoundError('Medicine not found');
    return prisma.medicine.update({ where: { id }, data });
  }

  /** Archives rather than deletes, so historical order line items keep referring to a real record. */
  async archiveMedicine(id: string) {
    const medicine = await prisma.medicine.findUnique({ where: { id } });
    if (!medicine) throw new NotFoundError('Medicine not found');
    return prisma.medicine.update({ where: { id }, data: { isArchived: true } });
  }

  async getMedicineOrders(params: { userId?: string; skip: number; take: number }) {
    const where = params.userId ? { userId: params.userId } : undefined;
    const [orders, total] = await prisma.$transaction([
      prisma.medicineOrder.findMany({
        where,
        include: { user: { select: { id: true, name: true, phone: true, email: true } }, items: { include: { medicine: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.medicineOrder.count({ where }),
    ]);
    return { orders, total };
  }

  async createMedicineOrder(
    userId: string,
    data: { pickupOrDelivery: string; deliveryAddress?: string; prescriptionUrl?: string; items: Array<{ medicineId: string; quantity: number }> }
  ) {
    const medIds = Array.from(new Set(data.items.map(i => i.medicineId)));
    const quantityByMedicine = new Map<string, number>();
    for (const item of data.items) {
      quantityByMedicine.set(item.medicineId, (quantityByMedicine.get(item.medicineId) ?? 0) + item.quantity);
    }

    const dbMeds = await prisma.medicine.findMany({ where: { id: { in: medIds } } });
    if (dbMeds.length !== medIds.length) {
      throw new BadRequestError('One or more selected medicines do not exist');
    }

    const needsPrescription = dbMeds.some(m => m.requiresPrescription);
    if (needsPrescription && !data.prescriptionUrl) {
      throw new BadRequestError('A prescription upload is required for one or more items in this order');
    }

    let totalAmount = 0;
    const orderItemsData: Array<{ medicineId: string; quantity: number; unitPrice: number }> = [];
    for (const med of dbMeds) {
      const quantity = quantityByMedicine.get(med.id)!;
      totalAmount += med.price * quantity;
      orderItemsData.push({ medicineId: med.id, quantity, unitPrice: med.price });
    }

    // Decrementing stock with a conditional WHERE (rather than read-then-write)
    // means two concurrent orders for the last unit can't both succeed — the
    // second `updateMany` simply matches zero rows and the transaction aborts.
    const order = await prisma.$transaction(async tx => {
      for (const item of orderItemsData) {
        const result = await tx.medicine.updateMany({
          where: { id: item.medicineId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          const med = dbMeds.find(m => m.id === item.medicineId);
          throw new ConflictError(`${med?.name ?? 'A medicine'} no longer has enough stock for this order`);
        }
      }

      return tx.medicineOrder.create({
        data: {
          userId,
          totalAmount,
          pickupOrDelivery: data.pickupOrDelivery,
          deliveryAddress: data.deliveryAddress,
          prescriptionUrl: data.prescriptionUrl,
          status: MedicineOrderStatus.PLACED,
          items: { create: orderItemsData },
        },
        include: { user: { select: { id: true, name: true, phone: true } }, items: { include: { medicine: true } } },
      });
    });

    await notifyRoles([Role.MEDICAL_STAFF, Role.ADMIN], {
      type: 'MEDICINE_ORDER',
      title: 'New pharmacy order',
      body: `Order #${order.orderNumber} placed`,
      data: { medicineOrderId: order.id },
    });

    return order;
  }

  async updateMedicineOrderStatus(id: string, status: MedicineOrderStatus) {
    const order = await prisma.medicineOrder.update({
      where: { id },
      data: { status },
      include: { user: true, items: { include: { medicine: true } } },
    });

    await notifyUser({
      userId: order.userId,
      type: 'MEDICINE_ORDER',
      title: 'Pharmacy order update',
      body: `Your order #${order.orderNumber} is now ${status.toLowerCase()}`,
      data: { medicineOrderId: id, status },
    });

    return order;
  }

  // --- CONSULTATIONS & TALK TO STAFF ---
  async getConsultations(params: { userId?: string; skip: number; take: number }) {
    const where = params.userId ? { userId: params.userId } : undefined;
    const [consultations, total] = await prisma.$transaction([
      prisma.consultation.findMany({
        where,
        include: { user: { select: { id: true, name: true, phone: true, email: true } }, assignedTo: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.consultation.count({ where }),
    ]);
    return { consultations, total };
  }

  async requestConsultation(userId: string, data: { type: ConsultationType; slotTime?: string; note?: string }) {
    const consultation = await prisma.consultation.create({
      data: {
        userId,
        type: data.type,
        slotTime: data.slotTime ? new Date(data.slotTime) : undefined,
        note: data.note,
        status: ConsultationStatus.REQUESTED,
      },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });

    await notifyRoles([Role.MEDICAL_STAFF, Role.ADMIN], {
      type: 'CONSULTATION',
      title: 'New consultation request',
      body: `${consultation.user.name} requested a ${data.type.toLowerCase()}`,
      data: { consultationId: consultation.id },
    });

    return consultation;
  }

  async updateConsultationStatus(id: string, status: ConsultationStatus, assignedToId?: string) {
    const consultation = await prisma.consultation.update({
      where: { id },
      data: { status, assignedToId: assignedToId || undefined },
      include: { user: true },
    });

    await notifyUser({
      userId: consultation.userId,
      type: 'CONSULTATION',
      title: 'Consultation update',
      body: `Your request is now ${status.toLowerCase()}`,
      data: { consultationId: id, status },
    });

    return consultation;
  }
}

export const medicalService = new MedicalService();
