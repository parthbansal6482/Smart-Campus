import { api } from './api';
import { Consultation, Emergency, EmergencyLocationPing, Medicine, MedicineOrder } from '../types';

export const medicalService = {
  getMedicines: async (category?: string, search?: string): Promise<Medicine[]> => {
    const res = await api.get<{ success: boolean; data: Medicine[] }>('/medical-help/medicines', {
      params: { category, search },
    });
    return res.data.data;
  },

  getMyEmergencies: async (): Promise<Emergency[]> => {
    const res = await api.get<{ success: boolean; data: Emergency[] }>('/medical-help/emergencies');
    return res.data.data;
  },

  sendEmergencyLocation: async (
    emergencyId: string,
    fix: { latitude: number; longitude: number; accuracyM?: number }
  ): Promise<EmergencyLocationPing> => {
    const res = await api.post<{ success: boolean; data: EmergencyLocationPing }>(
      `/medical-help/emergencies/${emergencyId}/location`,
      fix
    );
    return res.data.data;
  },

  getMyMedicineOrders: async (): Promise<MedicineOrder[]> => {
    const res = await api.get<{ success: boolean; data: MedicineOrder[] }>('/medical-help/medicine-orders');
    return res.data.data;
  },

  placeMedicineOrder: async (data: {
    pickupOrDelivery: 'PICKUP' | 'DELIVERY';
    deliveryAddress?: string;
    prescriptionUrl?: string;
    items: Array<{ medicineId: string; quantity: number }>;
  }): Promise<MedicineOrder> => {
    const res = await api.post<{ success: boolean; data: MedicineOrder }>('/medical-help/medicine-orders', data);
    return res.data.data;
  },

  getMyConsultations: async (): Promise<Consultation[]> => {
    const res = await api.get<{ success: boolean; data: Consultation[] }>('/medical-help/consultations');
    return res.data.data;
  },

  requestConsultation: async (data: { type: Consultation['type']; slotTime?: string; note?: string }): Promise<Consultation> => {
    const res = await api.post<{ success: boolean; data: Consultation }>('/medical-help/consultations', data);
    return res.data.data;
  },
};
