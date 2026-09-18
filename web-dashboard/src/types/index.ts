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
  rooms?: Room[];
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

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  startTime: string;
  endTime: string;
  purpose?: string;
  status: BookingStatus;
  room?: Room;
  user?: User;
}

export type EmergencyStatus =
  | 'REPORTED'
  | 'ASSIGNED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'HANDLED'
  | 'CANCELLED';

export type EmergencyTag = 'FAINTED' | 'INJURY' | 'ALLERGIC_REACTION' | 'OTHER';

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
  user?: User;
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

export type MedicineOrderStatus = 'PLACED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface MedicineOrder {
  id: string;
  userId: string;
  totalAmount: number;
  status: MedicineOrderStatus;
  pickupOrDelivery: string;
  deliveryAddress?: string;
  prescriptionUrl?: string;
  createdAt: string;
  user?: User;
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
  assignedTo?: string;
  createdAt: string;
  user?: User;
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

export type OrderType = 'PICKUP' | 'DINE_IN';
export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COLLECTED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  menuItem?: MenuItem;
}

export interface Order {
  id: string;
  userId: string;
  orderType: OrderType;
  tableNumber?: string;
  orderToken: string;
  status: OrderStatus;
  pickupTime?: string;
  totalAmount: number;
  note?: string;
  createdAt: string;
  user?: User;
  orderItems?: OrderItem[];
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

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}
