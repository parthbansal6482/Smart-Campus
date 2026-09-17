export type Role = 'STUDENT' | 'FACULTY' | 'STAFF' | 'ADMIN' | 'RESPONDER';

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

export type EmergencyStatus = 'REPORTED' | 'DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

export interface Emergency {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  buildingId?: string;
  description?: string;
  status: EmergencyStatus;
  reportedAt: string;
  resolvedAt?: string;
  user?: User;
  building?: Building;
}

export type MenuCategory = 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'BEVERAGES' | 'SPECIAL';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: MenuCategory;
  isAvailable: boolean;
  imageUrl?: string;
}

export type OrderType = 'PICKUP' | 'DINE_IN';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

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
  status: OrderStatus;
  pickupTime?: string;
  totalAmount: number;
  note?: string;
  createdAt: string;
  user?: User;
  orderItems?: OrderItem[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}
