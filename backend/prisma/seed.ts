import { PrismaClient, Role, MenuCategory, OrderType, OrderStatus, BookingStatus, EmergencyStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing records (in reverse relation order)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.emergency.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.building.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned previous database records.');

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 3. Create Users
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@smartcampus.edu',
      passwordHash,
      role: Role.ADMIN,
      phone: '+1-555-0101',
    },
  });

  const facultyUser = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Connor',
      email: 'faculty@smartcampus.edu',
      passwordHash,
      role: Role.FACULTY,
      phone: '+1-555-0102',
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      name: 'Alex Johnson',
      email: 'student@smartcampus.edu',
      passwordHash,
      role: Role.STUDENT,
      phone: '+1-555-0103',
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      name: 'Chef Gordon',
      email: 'staff@smartcampus.edu',
      passwordHash,
      role: Role.STAFF,
      phone: '+1-555-0104',
    },
  });

  const responderUser = await prisma.user.create({
    data: {
      name: 'Campus EMT Team',
      email: 'responder@smartcampus.edu',
      passwordHash,
      role: Role.RESPONDER,
      phone: '+1-555-0105',
    },
  });

  console.log('👥 Created seed users for all roles.');

  // 4. Create Buildings
  const engineeringBuilding = await prisma.building.create({
    data: {
      name: 'Alan Turing Engineering Hall',
      code: 'ENG',
      latitude: 37.7749,
      longitude: -122.4194,
      floorCount: 4,
    },
  });

  const scienceBuilding = await prisma.building.create({
    data: {
      name: 'Marie Curie Science Complex',
      code: 'SCI',
      latitude: 37.7755,
      longitude: -122.4185,
      floorCount: 3,
    },
  });

  const studentCenter = await prisma.building.create({
    data: {
      name: 'Student Hub & Commons',
      code: 'HUB',
      latitude: 37.7741,
      longitude: -122.4205,
      floorCount: 2,
    },
  });

  console.log('🏢 Created seed buildings.');

  // 5. Create Rooms
  const room101 = await prisma.room.create({
    data: {
      buildingId: engineeringBuilding.id,
      roomNumber: 'ENG-101',
      floor: 1,
      capacity: 60,
      hasAC: true,
      hasProjector: true,
      isOccupied: false,
    },
  });

  const room204 = await prisma.room.create({
    data: {
      buildingId: engineeringBuilding.id,
      roomNumber: 'ENG-204',
      floor: 2,
      capacity: 35,
      hasAC: true,
      hasProjector: true,
      isOccupied: true,
    },
  });

  const roomLabA = await prisma.room.create({
    data: {
      buildingId: scienceBuilding.id,
      roomNumber: 'SCI-LabA',
      floor: 1,
      capacity: 25,
      hasAC: true,
      hasProjector: false,
      isOccupied: false,
    },
  });

  console.log('🏫 Created seed classrooms.');

  // 6. Create Classroom Bookings
  const now = new Date();
  const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  const endTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now

  await prisma.booking.create({
    data: {
      roomId: room101.id,
      userId: facultyUser.id,
      startTime,
      endTime,
      purpose: 'CS401: Distributed Systems Lecture',
      status: BookingStatus.CONFIRMED,
    },
  });

  // 7. Create Menu Items
  const coffee = await prisma.menuItem.create({
    data: {
      name: 'Cold Brew Artisan Coffee',
      description: 'Slow-steeped organic coffee with a splash of oat milk.',
      price: 4.5,
      category: MenuCategory.BEVERAGES,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5',
    },
  });

  const sandwich = await prisma.menuItem.create({
    data: {
      name: 'Avocado & Grilled Chicken Panini',
      description: 'Fresh sourdough with smoked gouda, pesto, and avocado.',
      price: 8.95,
      category: MenuCategory.LUNCH,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af',
    },
  });

  const croissant = await prisma.menuItem.create({
    data: {
      name: 'Butter Croissant',
      description: 'Flaky and golden French-style butter pastry.',
      price: 3.25,
      category: MenuCategory.BREAKFAST,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a',
    },
  });

  console.log('🍔 Created cafeteria menu items.');

  // 8. Create Sample Order
  const order = await prisma.order.create({
    data: {
      userId: studentUser.id,
      orderType: OrderType.PICKUP,
      status: OrderStatus.PREPARING,
      totalAmount: 13.45,
      pickupTime: new Date(now.getTime() + 20 * 60 * 1000),
      note: 'Extra napkins please!',
      orderItems: {
        create: [
          { menuItemId: coffee.id, quantity: 1, unitPrice: 4.5 },
          { menuItemId: sandwich.id, quantity: 1, unitPrice: 8.95 },
        ],
      },
    },
  });

  console.log(`📦 Created sample order: ${order.id}`);

  // 9. Create Sample Emergency Record
  await prisma.emergency.create({
    data: {
      userId: studentUser.id,
      buildingId: scienceBuilding.id,
      latitude: 37.7756,
      longitude: -122.4184,
      description: 'Minor lab chemical burn, first-aid required in SCI-LabA',
      status: EmergencyStatus.DISPATCHED,
    },
  });

  console.log('🚨 Created sample emergency incident.');
  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
