import { prisma } from '../../config/db';
import { EmergencyStatus } from '@prisma/client';
import { NotFoundError } from '../../utils/errors';

// Haversine distance in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
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

export class EmergencyService {
  async getActiveEmergencies() {
    return prisma.emergency.findMany({
      where: {
        status: { in: [EmergencyStatus.REPORTED, EmergencyStatus.DISPATCHED, EmergencyStatus.IN_PROGRESS] },
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        building: true,
      },
      orderBy: { reportedAt: 'desc' },
    });
  }

  async getAllEmergencies() {
    return prisma.emergency.findMany({
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        building: true,
      },
      orderBy: { reportedAt: 'desc' },
    });
  }

  async getEmergencyById(id: string) {
    const emergency = await prisma.emergency.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        building: true,
      },
    });

    if (!emergency) {
      throw new NotFoundError('Emergency record not found');
    }

    return emergency;
  }

  async triggerEmergency(userId: string, data: { latitude: number; longitude: number; buildingId?: string; description?: string }) {
    let resolvedBuildingId = data.buildingId;

    // If buildingId not provided, locate closest campus building
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
        description: data.description,
        status: EmergencyStatus.REPORTED,
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        building: true,
      },
    });
  }

  async updateStatus(id: string, status: EmergencyStatus) {
    const emergency = await prisma.emergency.findUnique({ where: { id } });
    if (!emergency) {
      throw new NotFoundError('Emergency record not found');
    }

    return prisma.emergency.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === EmergencyStatus.RESOLVED || status === EmergencyStatus.CANCELLED ? new Date() : null,
      },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        building: true,
      },
    });
  }
}

export const emergencyService = new EmergencyService();
