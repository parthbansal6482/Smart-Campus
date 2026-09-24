import type { EmergencyStatus, EmergencyTag, MedicineOrderStatus, OrderStatus, Role, Consultation } from '../types';

export type Tone = 'neutral' | 'ok' | 'warn' | 'critical' | 'info';

export const emergencyFlow: EmergencyStatus[] = ['REPORTED', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'HANDLED'];

export const emergencyLabel: Record<EmergencyStatus, string> = {
  REPORTED: 'Reported',
  ASSIGNED: 'Responder assigned',
  ON_THE_WAY: 'On the way',
  ARRIVED: 'Arrived',
  HANDLED: 'Handled',
  CANCELLED: 'Cancelled',
};

export const emergencyNextAction: Partial<Record<EmergencyStatus, { status: EmergencyStatus; label: string }>> = {
  REPORTED: { status: 'ASSIGNED', label: 'Assign responder' },
  ASSIGNED: { status: 'ON_THE_WAY', label: 'Mark on the way' },
  ON_THE_WAY: { status: 'ARRIVED', label: 'Mark arrived' },
  ARRIVED: { status: 'HANDLED', label: 'Mark handled' },
};

export const emergencyTone = (status: EmergencyStatus): Tone => {
  if (status === 'REPORTED') return 'critical';
  if (status === 'HANDLED') return 'ok';
  if (status === 'CANCELLED') return 'neutral';
  return 'warn';
};

export const isEmergencyActive = (status: EmergencyStatus) => status !== 'HANDLED' && status !== 'CANCELLED';

export const orderLabel: Record<OrderStatus, string> = {
  PLACED: 'New',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COLLECTED: 'Collected',
  CANCELLED: 'Cancelled',
};

export const orderTone = (status: OrderStatus): Tone => {
  switch (status) {
    case 'PLACED':
    case 'ACCEPTED':
      return 'info';
    case 'PREPARING':
      return 'warn';
    case 'READY':
      return 'ok';
    case 'CANCELLED':
      return 'critical';
    default:
      return 'neutral';
  }
};

export const orderNextAction: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  PLACED: { status: 'PREPARING', label: 'Start preparing' },
  ACCEPTED: { status: 'PREPARING', label: 'Start preparing' },
  PREPARING: { status: 'READY', label: 'Mark ready' },
  READY: { status: 'COLLECTED', label: 'Mark collected' },
};

export const medicineOrderTone = (status: MedicineOrderStatus): Tone => {
  switch (status) {
    case 'PLACED':
      return 'info';
    case 'PREPARING':
      return 'warn';
    case 'READY':
      return 'ok';
    case 'CANCELLED':
      return 'critical';
    default:
      return 'neutral';
  }
};

export const medicineOrderNextAction: Partial<Record<MedicineOrderStatus, { status: MedicineOrderStatus; label: string }>> = {
  PLACED: { status: 'PREPARING', label: 'Start preparing' },
  PREPARING: { status: 'READY', label: 'Mark ready' },
  READY: { status: 'DELIVERED', label: 'Mark handed over' },
};

export const consultationTone = (status: Consultation['status']): Tone => {
  switch (status) {
    case 'REQUESTED':
      return 'info';
    case 'SCHEDULED':
      return 'warn';
    case 'COMPLETED':
      return 'ok';
    default:
      return 'neutral';
  }
};

export const roleLabel: Record<Role, string> = {
  ADMIN: 'Administrator',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
  CAFETERIA_STAFF: 'Cafeteria staff',
  MEDICAL_STAFF: 'Medical staff',
  AMBULANCE_RESPONDER: 'Ambulance responder',
};

const tagLabel: Record<EmergencyTag, string> = {
  FAINTED: 'Fainted',
  INJURY: 'Injury',
  ALLERGIC_REACTION: 'Allergic reaction',
  OTHER: 'Medical emergency',
};

export const humanizeTag = (tag: EmergencyTag) => tagLabel[tag] ?? 'Medical emergency';
