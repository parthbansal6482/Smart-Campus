import { prisma } from '../../config/db';
import { EmergencyStatus, EmergencyTag, MedicineCategory, MedicineOrderStatus, ConsultationType, ConsultationStatus } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../utils/errors';

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export class MedicalService {
  // --- EMERGENCY TRACK ---
  async getActiveEmergencies() {
    return prisma.emergency.findMany({
      where: {
        status: { in: [EmergencyStatus.REPORTED, EmergencyStatus.ASSIGNED, EmergencyStatus.ON_THE_WAY, EmergencyStatus.ARRIVED] },
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        building: true,
      },
      orderBy: { reportedAt: 'desc' },
    });
  }

  async getAllEmergencies(userId?: string) {
    return prisma.emergency.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        building: true,
      },
      orderBy: { reportedAt: 'desc' },
    });
  }

  async triggerEmergency(userId: string, data: { latitude: number; longitude: number; buildingId?: string; tag?: EmergencyTag; description?: string }) {
    let resolvedBuildingId = data.buildingId;

    if (!resolvedBuildingId) {
      const buildings = await prisma.building.findMany();
      if (buildings.length > 0) {
        let nearest = buildings[0];
        let minDistance = calculateDistanceMeters(data.latitude, data.longitude, nearest.latitude, nearest.longitude);

        for (const b of buildings) {
          const dist = calculateDistanceMeters(data.latitude, data.longitude, b.latitude, b.longitude);
          if (dist < minDistance) {
            minDistance = dist;
            nearest = b;
          }
        }
        resolvedBuildingId = nearest.id;
      }
    }

    return prisma.emergency.create({
      data: {
        userId,
        latitude: data.latitude,
        longitude: data.longitude,
        buildingId: resolvedBuildingId,
        tag: data.tag || EmergencyTag.OTHER,
        description: data.description,
        status: EmergencyStatus.REPORTED,
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        building: true,
      },
    });
  }

  async updateEmergencyStatus(id: string, status: EmergencyStatus, responderId?: string) {
    const emergency = await prisma.emergency.findUnique({ where: { id } });
    if (!emergency) throw new NotFoundError('Emergency incident not found');

    return prisma.emergency.update({
      where: { id },
      data: {
        status,
        responderId: responderId || emergency.responderId,
        resolvedAt: status === EmergencyStatus.HANDLED || status === EmergencyStatus.CANCELLED ? new Date() : null,
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        building: true,
      },
    });
  }

  // --- MEDICINE STORE TRACK ---
  async getMedicines(category?: MedicineCategory, search?: string) {
    return prisma.medicine.findMany({
      where: {
        category: category || undefined,
        name: search ? { contains: search, mode: 'insensitive' } : undefined,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createMedicine(data: any) {
    return prisma.medicine.create({ data });
  }

  async updateMedicine(id: string, data: any) {
    return prisma.medicine.update({ where: { id }, data });
  }

  async deleteMedicine(id: string) {
    return prisma.medicine.delete({ where: { id } });
  }

  async getMedicineOrders(userId?: string) {
    return prisma.medicineOrder.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        items: { include: { medicine: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMedicineOrder(userId: string, data: { pickupOrDelivery: string; deliveryAddress?: string; prescriptionUrl?: string; items: Array<{ medicineId: string; quantity: number }> }) {
    const medIds = data.items.map(i => i.medicineId);
    const dbMeds = await prisma.medicine.findMany({ where: { id: { in: medIds } } });

    let totalAmount = 0;
    const orderItems: Array<{ medicineId: string; quantity: number; unitPrice: number }> = [];

    for (const item of data.items) {
      const dbMed = dbMeds.find(m => m.id === item.medicineId);
      if (!dbMed || dbMed.stock < item.quantity) {
        throw new BadRequestError(`Medicine ${dbMed?.name || item.medicineId} out of stock`);
      }
      totalAmount += dbMed.price * item.quantity;
      orderItems.push({
        medicineId: item.medicineId,
        quantity: item.quantity,
        unitPrice: dbMed.price,
      });
    }

    return prisma.medicineOrder.create({
      data: {
        userId,
        totalAmount,
        pickupOrDelivery: data.pickupOrDelivery,
        deliveryAddress: data.deliveryAddress,
        prescriptionUrl: data.prescriptionUrl,
        status: MedicineOrderStatus.PLACED,
        items: { create: orderItems },
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        items: { include: { medicine: true } },
      },
    });
  }

  async updateMedicineOrderStatus(id: string, status: MedicineOrderStatus) {
    return prisma.medicineOrder.update({
      where: { id },
      data: { status },
      include: { user: true, items: { include: { medicine: true } } },
    });
  }

  // --- CONSULTATIONS & TALK TO STAFF ---
  async getConsultations(userId?: string) {
    return prisma.consultation.findMany({
      where: userId ? { userId } : undefined,
      include: { user: { select: { id: true, name: true, phone: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async requestConsultation(userId: string, data: { type: ConsultationType; slotTime?: string; note?: string }) {
    return prisma.consultation.create({
      data: {
        userId,
        type: data.type,
        slotTime: data.slotTime ? new Date(data.slotTime) : undefined,
        note: data.note,
        status: ConsultationStatus.REQUESTED,
      },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });
  }

  async updateConsultationStatus(id: string, status: ConsultationStatus, assignedTo?: string) {
    return prisma.consultation.update({
      where: { id },
      data: { status, assignedTo: assignedTo || undefined },
      include: { user: true },
    });
  }
}

export const medicalService = new MedicalService();
