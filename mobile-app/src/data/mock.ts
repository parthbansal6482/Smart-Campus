/**
 * Placeholder data for the screens that are not yet connected to the API.
 * Shapes match the backend models so screens can switch to live data without layout changes.
 */
import { MenuItem, Medicine, Room } from '../types';

export interface RoomListing extends Room {
  /** Human-readable availability window, e.g. "Free until 3:00 PM". */
  availability: string;
}

const buildings = {
  ENG: { id: 'b-eng', name: 'Alan Turing Engineering Hall', code: 'ENG', latitude: 0, longitude: 0, floorCount: 4 },
  SCI: { id: 'b-sci', name: 'Marie Curie Science Complex', code: 'SCI', latitude: 0, longitude: 0, floorCount: 3 },
  RTH: { id: 'b-rth', name: 'RTH Academic Block', code: 'RTH', latitude: 0, longitude: 0, floorCount: 3 },
};

export const ROOMS: RoomListing[] = [
  { id: 'r1', buildingId: 'b-rth', roomNumber: 'RTH-105', floor: 0, capacity: 80, hasAC: true, hasProjector: true, isOccupied: false, building: buildings.RTH, availability: 'Free until 3:00 PM' },
  { id: 'r2', buildingId: 'b-eng', roomNumber: 'ENG-101', floor: 1, capacity: 60, hasAC: true, hasProjector: true, isOccupied: false, building: buildings.ENG, availability: 'Free for the rest of the day' },
  { id: 'r3', buildingId: 'b-eng', roomNumber: 'ENG-204', floor: 2, capacity: 35, hasAC: true, hasProjector: true, isOccupied: true, building: buildings.ENG, availability: 'Lecture until 12:50 PM' },
  { id: 'r4', buildingId: 'b-sci', roomNumber: 'SCI-Lab A', floor: 1, capacity: 25, hasAC: false, hasProjector: true, isOccupied: false, building: buildings.SCI, availability: 'Free until 2:00 PM' },
  { id: 'r5', buildingId: 'b-sci', roomNumber: 'SCI-302', floor: 3, capacity: 40, hasAC: true, hasProjector: false, isOccupied: true, building: buildings.SCI, availability: 'Booked until 4:00 PM' },
  { id: 'r6', buildingId: 'b-rth', roomNumber: 'RTH-210', floor: 2, capacity: 45, hasAC: true, hasProjector: true, isOccupied: false, building: buildings.RTH, availability: 'Free until 5:00 PM' },
];

export const MENU: MenuItem[] = [
  { id: 'm1', name: 'Rajma rice', description: 'Slow-cooked kidney beans in a tomato gravy with steamed basmati.', price: 80, category: 'LUNCH', isVeg: true, spiceLevel: 1, rating: 4.6, isAvailable: true },
  { id: 'm2', name: 'Veg biryani', description: 'Fragrant basmati layered with seasonal vegetables, served with raita.', price: 100, category: 'LUNCH', isVeg: true, spiceLevel: 2, rating: 4.5, isAvailable: true },
  { id: 'm3', name: 'Chicken biryani', description: 'Dum-cooked with whole spices, served with raita and salan.', price: 140, category: 'LUNCH', isVeg: false, spiceLevel: 2, rating: 4.7, isAvailable: true },
  { id: 'm4', name: 'Grilled sandwich', description: 'Vegetables, cheese and mint chutney on toasted bread.', price: 60, category: 'SNACKS', isVeg: true, spiceLevel: 0, rating: 4.3, isAvailable: true },
  { id: 'm5', name: 'Hakka noodles', description: 'Wok-tossed with cabbage, carrot and spring onion.', price: 70, category: 'SNACKS', isVeg: true, spiceLevel: 1, rating: 4.2, isAvailable: true },
  { id: 'm6', name: 'Paneer kathi roll', description: 'Tandoori paneer and onions wrapped in a flaky paratha.', price: 90, category: 'SNACKS', isVeg: true, spiceLevel: 2, rating: 4.6, isAvailable: false },
  { id: 'm7', name: 'Masala dosa', description: 'Crisp rice crêpe with spiced potato, sambar and chutney.', price: 60, category: 'BREAKFAST', isVeg: true, spiceLevel: 1, rating: 4.8, isAvailable: true },
  { id: 'm8', name: 'Poha', description: 'Flattened rice with peanuts, curry leaves and lemon.', price: 40, category: 'BREAKFAST', isVeg: true, spiceLevel: 0, rating: 4.4, isAvailable: true },
  { id: 'm9', name: 'Cold coffee', description: 'Blended with milk and a scoop of vanilla ice cream.', price: 50, category: 'BEVERAGES', isVeg: true, spiceLevel: 0, rating: 4.5, isAvailable: true },
  { id: 'm10', name: 'Masala chai', description: 'Brewed with ginger and cardamom.', price: 20, category: 'BEVERAGES', isVeg: true, spiceLevel: 0, rating: 4.9, isAvailable: true },
  { id: 'm11', name: 'Gulab jamun', description: 'Two pieces, served warm.', price: 40, category: 'DESSERTS', isVeg: true, spiceLevel: 0, rating: 4.7, isAvailable: true },
];

export const MEDICINES: Medicine[] = [
  { id: 'd1', name: 'Paracetamol 500mg', category: 'PAIN_RELIEF', price: 25, description: 'Strip of 10 tablets. For fever, headache and body ache.', stock: 120, requiresPrescription: false },
  { id: 'd2', name: 'First-aid kit', category: 'FIRST_AID', price: 199, description: 'Sterile gauze, antiseptic wipes, tape and bandages.', stock: 45, requiresPrescription: false },
  { id: 'd3', name: 'Amoxicillin 250mg', category: 'PRESCRIPTION_ONLY', price: 95, description: 'Antibiotic. A campus doctor’s prescription is required.', stock: 18, requiresPrescription: true },
  { id: 'd4', name: 'Cetirizine 10mg', category: 'COLD_FEVER', price: 30, description: 'Strip of 10 tablets. For allergies and a runny nose.', stock: 60, requiresPrescription: false },
  { id: 'd5', name: 'ORS sachet', category: 'FIRST_AID', price: 20, description: 'Oral rehydration salts for dehydration and fatigue.', stock: 200, requiresPrescription: false },
];

export const CAMPUS = {
  securityPhone: '+91 11 2659 1111',
  medicalCenterPhone: '+91 11 2659 1234',
  medicalCenterLocation: 'Health Block, ground floor — next to the Student Centre',
  kitchenHours: '8:00 AM – 9:00 PM',
};
