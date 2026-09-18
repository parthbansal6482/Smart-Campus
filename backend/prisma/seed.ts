import {
  PrismaClient,
  Role,
  MenuCategory,
  OrderType,
  OrderStatus,
  BookingStatus,
  EmergencyStatus,
  EmergencyTag,
  MedicineCategory,
  MedicineOrderStatus,
  ConsultationType,
  ConsultationStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing records in reverse relation order
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.offer.deleteMany();

  await prisma.medicineOrderItem.deleteMany();
  await prisma.medicineOrder.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.emergency.deleteMany();

  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.building.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned previous database records.');

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 3. Create Users for all roles
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

  const cafeteriaStaff = await prisma.user.create({
    data: {
      name: 'Chef Gordon',
      email: 'cafeteria@smartcampus.edu',
      passwordHash,
      role: Role.CAFETERIA_STAFF,
      phone: '+1-555-0104',
    },
  });

  const medicalStaff = await prisma.user.create({
    data: {
      name: 'Dr. House (Medical Center)',
      email: 'medical@smartcampus.edu',
      passwordHash,
      role: Role.MEDICAL_STAFF,
      phone: '+1-555-0105',
    },
  });

  const responderUser = await prisma.user.create({
    data: {
      name: 'Ambulance Unit 1',
      email: 'responder@smartcampus.edu',
      passwordHash,
      role: Role.AMBULANCE_RESPONDER,
      phone: '+1-555-0106',
    },
  });

  console.log('👥 Created seed users across all roles.');

  // 4. Create Buildings & Rooms (Classroom Module)
  const engBuilding = await prisma.building.create({
    data: {
      name: 'Alan Turing Engineering Hall',
      code: 'ENG',
      latitude: 37.7749,
      longitude: -122.4194,
      floorCount: 4,
    },
  });

  const sciBuilding = await prisma.building.create({
    data: {
      name: 'Marie Curie Science Complex',
      code: 'SCI',
      latitude: 37.7755,
      longitude: -122.4185,
      floorCount: 3,
    },
  });

  const room101 = await prisma.room.create({
    data: {
      buildingId: engBuilding.id,
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
      buildingId: engBuilding.id,
      roomNumber: 'ENG-204',
      floor: 2,
      capacity: 35,
      hasAC: true,
      hasProjector: true,
      isOccupied: true,
    },
  });

  await prisma.booking.create({
    data: {
      roomId: room101.id,
      userId: facultyUser.id,
      startTime: new Date(Date.now() + 3600000),
      endTime: new Date(Date.now() + 7200000),
      purpose: 'CS401: Distributed Systems Lecture',
      status: BookingStatus.CONFIRMED,
    },
  });

  console.log('🏫 Created classroom module seed data.');

  // 5. Medical Help Module Data
  const emergencyIncident = await prisma.emergency.create({
    data: {
      userId: studentUser.id,
      buildingId: sciBuilding.id,
      latitude: 37.7756,
      longitude: -122.4184,
      tag: EmergencyTag.INJURY,
      description: 'Lab minor chemical splash, first-aid required on Floor 1',
      status: EmergencyStatus.ASSIGNED,
      responderId: responderUser.id,
    },
  });

  const paracetamol = await prisma.medicine.create({
    data: {
      name: 'Paracetamol 500mg (10 Tabs)',
      category: MedicineCategory.PAIN_RELIEF,
      price: 2.5,
      description: 'Relieves fever and mild to moderate body pain.',
      stock: 120,
      requiresPrescription: false,
    },
  });

  const bandageKit = await prisma.medicine.create({
    data: {
      name: 'Sterile First Aid Bandage & Antiseptic Wipes',
      category: MedicineCategory.FIRST_AID,
      price: 4.99,
      description: 'Emergency wound cleaning and waterproof bandaging kit.',
      stock: 45,
      requiresPrescription: false,
    },
  });

  const coughSyrup = await prisma.medicine.create({
    data: {
      name: 'Amoxicillin Antibiotic 250mg',
      category: MedicineCategory.PRESCRIPTION_ONLY,
      price: 9.5,
      description: 'Prescription required. Doctor note verification mandatory.',
      stock: 20,
      requiresPrescription: true,
    },
  });

  await prisma.medicineOrder.create({
    data: {
      userId: studentUser.id,
      totalAmount: 4.99,
      status: MedicineOrderStatus.PREPARING,
      pickupOrDelivery: 'DELIVERY',
      deliveryAddress: 'Hostel Block B, Room 302',
      items: {
        create: [
          { medicineId: bandageKit.id, quantity: 1, unitPrice: 4.99 },
        ],
      },
    },
  });

  await prisma.consultation.create({
    data: {
      userId: studentUser.id,
      type: ConsultationType.CALLBACK,
      status: ConsultationStatus.REQUESTED,
      note: 'Experiencing seasonal allergies, request advice on antihistamines.',
    },
  });

  console.log('🏥 Created medical help module seed data.');

  // 6. Cafeteria Module Data
  const coffee = await prisma.menuItem.create({
    data: {
      name: 'Cold Brew Artisan Coffee',
      description: 'Slow-steeped organic coffee with a splash of oat milk.',
      price: 4.5,
      category: MenuCategory.BEVERAGES,
      isVeg: true,
      spiceLevel: 0,
      rating: 4.8,
      isAvailable: true,
    },
  });

  const panini = await prisma.menuItem.create({
    data: {
      name: 'Avocado & Grilled Chicken Panini',
      description: 'Fresh sourdough with smoked gouda, pesto, and grilled chicken.',
      price: 8.95,
      category: MenuCategory.LUNCH,
      isVeg: false,
      spiceLevel: 1,
      rating: 4.7,
      isAvailable: true,
    },
  });

  const brownie = await prisma.menuItem.create({
    data: {
      name: 'Fudge Walnut Brownie',
      description: 'Rich dark chocolate baked brownie topped with walnuts.',
      price: 3.5,
      category: MenuCategory.DESSERTS,
      isVeg: true,
      spiceLevel: 0,
      rating: 4.9,
      isAvailable: true,
    },
  });

  await prisma.offer.create({
    data: {
      title: 'Chef Special Combo 15% OFF',
      description: 'Get Cold Brew Coffee + Chicken Panini for just \$11.40',
      code: 'CAMPUS15',
      discountPercent: 15,
      isBanner: true,
    },
  });

  await prisma.order.create({
    data: {
      userId: studentUser.id,
      orderType: OrderType.PICKUP,
      orderToken: '#ORD-104',
      status: OrderStatus.PREPARING,
      totalAmount: 13.45,
      pickupTime: new Date(Date.now() + 1200000),
      note: 'Extra napkins please!',
      orderItems: {
        create: [
          { menuItemId: coffee.id, quantity: 1, unitPrice: 4.5 },
          { menuItemId: panini.id, quantity: 1, unitPrice: 8.95 },
        ],
      },
    },
  });

  console.log('🍔 Created cafeteria module seed data.');
  console.log('✅ Unified database seed completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
