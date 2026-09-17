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

export interface Emergency {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  buildingId?: string;
  description?: string;
  status: 'REPORTED' | 'DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  reportedAt: string;
  resolvedAt?: string;
  building?: Building;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'BEVERAGES' | 'SPECIAL';
  isAvailable: boolean;
  imageUrl?: string;
}

export interface Order {
  id: string;
  userId: string;
  orderType: 'PICKUP' | 'DINE_IN';
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
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

// React Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  BookRoom: { room?: Room };
  EmergencyModal: undefined;
  MenuDetail: { item: MenuItem };
  Orders: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ClassroomsTab: undefined;
  CafeteriaTab: undefined;
  ProfileTab: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};
