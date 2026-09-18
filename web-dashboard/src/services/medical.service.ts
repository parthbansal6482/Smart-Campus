import { api } from './api';
import { ApiResponse, Emergency, EmergencyStatus, Medicine, MedicineOrder, MedicineOrderStatus, Consultation } from '../types';

export const medicalService = {
  // Emergencies Track
  getActiveEmergencies: async (): Promise<Emergency[]> => {
    const res = await api.get<ApiResponse<Emergency[]>>('/medical-help/emergencies/active');
    return res.data.data;
  },

  getAllEmergencies: async (all = true): Promise<Emergency[]> => {
    const res = await api.get<ApiResponse<Emergency[]>>('/medical-help/emergencies', { params: { all } });
    return res.data.data;
  },

  updateEmergencyStatus: async (id: string, status: EmergencyStatus, responderId?: string): Promise<Emergency> => {
    const res = await api.patch<ApiResponse<Emergency>>(`/medical-help/emergencies/${id}/status`, { status, responderId });
    return res.data.data;
  },

  // Medicine Catalog & Inventory
  getMedicines: async (category?: string, search?: string): Promise<Medicine[]> => {
    const res = await api.get<ApiResponse<Medicine[]>>('/medical-help/medicines', { params: { category, search } });
    return res.data.data;
  },

  createMedicine: async (data: Partial<Medicine>): Promise<Medicine> => {
    const res = await api.post<ApiResponse<Medicine>>('/medical-help/medicines', data);
    return res.data.data;
  },

  updateMedicine: async (id: string, data: Partial<Medicine>): Promise<Medicine> => {
    const res = await api.patch<ApiResponse<Medicine>>(`/medical-help/medicines/${id}`, data);
    return res.data.data;
  },

  deleteMedicine: async (id: string): Promise<void> => {
    await api.delete(`/medical-help/medicines/${id}`);
  },

  // Medicine Orders
  getMedicineOrders: async (all = true): Promise<MedicineOrder[]> => {
    const res = await api.get<ApiResponse<MedicineOrder[]>>('/medical-help/medicine-orders', { params: { all } });
    return res.data.data;
  },

  updateMedicineOrderStatus: async (id: string, status: MedicineOrderStatus): Promise<MedicineOrder> => {
    const res = await api.patch<ApiResponse<MedicineOrder>>(`/medical-help/medicine-orders/${id}/status`, { status });
    return res.data.data;
  },

  // Consultations
  getConsultations: async (all = true): Promise<Consultation[]> => {
    const res = await api.get<ApiResponse<Consultation[]>>('/medical-help/consultations', { params: { all } });
    return res.data.data;
  },

  updateConsultationStatus: async (id: string, status: string, assignedTo?: string): Promise<Consultation> => {
    const res = await api.patch<ApiResponse<Consultation>>(`/medical-help/consultations/${id}/status`, { status, assignedTo });
    return res.data.data;
  },
};
