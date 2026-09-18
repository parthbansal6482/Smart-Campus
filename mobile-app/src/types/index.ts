export type Role =
  | 'STUDENT'
  | 'FACULTY'
  | 'CAFETERIA_STAFF'
  | 'MEDICAL_STAFF'
  | 'AMBULANCE_RESPONDER'
  | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  createdAt: string;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  floorCount: number;
}

export interface Room {
  id: string;
  buildingId: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  hasAC: boolean;
  hasProjector: boolean;
  isOccupied: boolean;
  building?: Building;
}

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  startTime: string;
  endTime: string;
  purpose?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  room?: Room;
}

export type EmergencyTag = 'FAINTED' | 'INJURY' | 'ALLERGIC_REACTION' | 'OTHER';
export type EmergencyStatus = 'REPORTED' | 'ASSIGNED' | 'ON_THE_WAY' | 'ARRIVED' | 'HANDLED' | 'CANCELLED';

export interface Emergency {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  buildingId?: string;
  tag: EmergencyTag;
  description?: string;
  status: EmergencyStatus;
  responderId?: string;
  reportedAt: string;
  resolvedAt?: string;
  building?: Building;
}

export type MedicineCategory = 'PAIN_RELIEF' | 'FIRST_AID' | 'COLD_FEVER' | 'PRESCRIPTION_ONLY' | 'GENERAL';

export interface Medicine {
  id: string;
  name: string;
  category: MedicineCategory;
  price: number;
  description?: string;
  stock: number;
  requiresPrescription: boolean;
  imageUrl?: string;
}

export interface MedicineOrder {
  id: string;
  userId: string;
  totalAmount: number;
  status: 'PLACED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  pickupOrDelivery: string;
  deliveryAddress?: string;
  prescriptionUrl?: string;
  createdAt: string;
  items?: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    medicine: Medicine;
  }>;
}

export interface Consultation {
  id: string;
  userId: string;
  type: 'CHAT' | 'CALLBACK' | 'APPOINTMENT';
  status: 'REQUESTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  slotTime?: string;
  note?: string;
  createdAt: string;
}

export type MenuCategory = 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'BEVERAGES' | 'DESSERTS' | 'SPECIAL';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: MenuCategory;
  isVeg: boolean;
  spiceLevel: number;
  rating: number;
  isAvailable: boolean;
  imageUrl?: string;
}

export interface Order {
  id: string;
  userId: string;
  orderType: 'PICKUP' | 'DINE_IN';
  tableNumber?: string;
  orderToken: string;
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COLLECTED' | 'CANCELLED';
  pickupTime?: string;
  totalAmount: number;
  note?: string;
  createdAt: string;
  orderItems?: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    menuItem: MenuItem;
  }>;
}

export interface Offer {
  id: string;
  title: string;
  description?: string;
  code: string;
  discountPercent: number;
  isBanner: boolean;
  imageUrl?: string;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  BookRoom: { room?: Room };
  EmergencyModal: undefined;
  MedicineStore: undefined;
  MedicineDetail: { medicine: Medicine };
  TalkToStaff: undefined;
  MedicalCenterInfo: undefined;
  MenuDetail: { item: MenuItem };
  Cart: undefined;
  OrderTrack: { order?: Order };
  Orders: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ClassroomsTab: undefined;
  MedicalHelpTab: undefined;
  CafeteriaTab: undefined;
  ProfileTab: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};
