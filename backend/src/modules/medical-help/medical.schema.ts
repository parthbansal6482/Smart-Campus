import { z } from 'zod';
import { EmergencyStatus, EmergencyTag, MedicineCategory, MedicineOrderStatus, ConsultationType, ConsultationStatus } from '@prisma/client';

export const triggerEmergencySchema = z.object({
  body: z.object({
    latitude: z.number(),
    longitude: z.number(),
    buildingId: z.string().optional(),
    tag: z.nativeEnum(EmergencyTag).default(EmergencyTag.OTHER),
    description: z.string().optional(),
  }),
});

export const updateEmergencyStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(EmergencyStatus),
    responderId: z.string().optional(),
  }),
});

export const createMedicineSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Medicine name required'),
    category: z.nativeEnum(MedicineCategory).default(MedicineCategory.GENERAL),
    price: z.number().positive(),
    description: z.string().optional(),
    stock: z.number().int().min(0).default(50),
    requiresPrescription: z.boolean().default(false),
    imageUrl: z.string().url().optional(),
  }),
});

export const createMedicineOrderSchema = z.object({
  body: z.object({
    pickupOrDelivery: z.enum(['PICKUP', 'DELIVERY']).default('PICKUP'),
    deliveryAddress: z.string().optional(),
    prescriptionUrl: z.string().optional(),
    items: z.array(
      z.object({
        medicineId: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    ).min(1, 'Order must contain at least one medicine'),
  }),
});

export const updateMedicineOrderStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(MedicineOrderStatus),
  }),
});

export const requestConsultationSchema = z.object({
  body: z.object({
    type: z.nativeEnum(ConsultationType).default(ConsultationType.CALLBACK),
    slotTime: z.string().datetime().optional(),
    note: z.string().optional(),
  }),
});

export const updateConsultationSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ConsultationStatus),
    assignedTo: z.string().optional(),
  }),
});
