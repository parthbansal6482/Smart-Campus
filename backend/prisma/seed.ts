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
  // This script wipes every table before reseeding — refuse to run it
  // against a production database, even by accident.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Refusing to run the destructive seed script against NODE_ENV=production. ' +
        'If you really mean it, run with NODE_ENV=development explicitly.'
    );
  }

  console.log('🌱 Starting database seed...');

  // 1. Clean existing records in reverse relation order
  await prisma.campusSetting.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();

  await prisma.menuReview.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.offer.deleteMany();

  await prisma.medicineOrderItem.deleteMany();
  await prisma.medicineOrder.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.emergency.deleteMany();

  await prisma.classSchedule.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.building.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned previous database records.');

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('Password@123', 12);

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

  // ENG-204 has a standing weekly lecture every Monday 09:00–10:30, so the
  // "find a free room" search has a recurring-schedule conflict to exercise.
  await prisma.classSchedule.create({
    data: {
      roomId: room204.id,
      dayOfWeek: 1,
      startMinute: 9 * 60,
      endMinute: 10 * 60 + 30,
      courseName: 'CS201: Data Structures',
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
      locationDetail: 'Ground floor, Chemistry Lab 1',
      tag: EmergencyTag.INJURY,
      description: 'Lab minor chemical splash, first-aid required on Floor 1',
      status: EmergencyStatus.ASSIGNED,
      responderId: responderUser.id,
      acknowledgedAt: new Date(),
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
  // Prices are in INR to match the apps' currency formatting. Photos are stable
  // placeholder URLs so the seed never depends on uploaded files.
  const photo = (slug: string, n = 1) => `https://picsum.photos/seed/${slug}-${n}/800/600`;

  type SeedItem = {
    name: string;
    description: string;
    price: number;
    category: MenuCategory;
    isVeg: boolean;
    spiceLevel?: number;
    servingSize: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number;
    sugarG?: number;
    sodiumMg?: number;
    ingredients: string[];
    allergens?: string[];
    stock?: number;
    isAvailable?: boolean;
    isArchived?: boolean;
  };

  const menuSeed: SeedItem[] = [
    // Breakfast
    { name: 'Masala Dosa', description: 'Crisp rice-lentil crepe filled with spiced potato, served with sambar and chutneys.', price: 70, category: MenuCategory.BREAKFAST, isVeg: true, spiceLevel: 1, servingSize: '1 dosa (220 g)', calories: 380, proteinG: 9, carbsG: 62, fatG: 11, fiberG: 4, sugarG: 3, sodiumMg: 640, ingredients: ['rice', 'urad dal', 'potato', 'onion', 'mustard seeds', 'curry leaves'] },
    { name: 'Poha', description: 'Flattened rice tempered with mustard, peanuts and lemon.', price: 40, category: MenuCategory.BREAKFAST, isVeg: true, spiceLevel: 1, servingSize: '1 plate (200 g)', calories: 270, proteinG: 6, carbsG: 46, fatG: 7, fiberG: 3, sugarG: 2, sodiumMg: 420, ingredients: ['flattened rice', 'peanuts', 'onion', 'turmeric', 'lemon'], allergens: ['peanuts'] },
    { name: 'Aloo Paratha with Curd', description: 'Two stuffed wheat flatbreads with fresh curd and pickle.', price: 60, category: MenuCategory.BREAKFAST, isVeg: true, spiceLevel: 1, servingSize: '2 parathas + 100 g curd', calories: 480, proteinG: 12, carbsG: 66, fatG: 18, fiberG: 6, sugarG: 5, sodiumMg: 710, ingredients: ['wheat flour', 'potato', 'curd', 'butter', 'spices'], allergens: ['gluten', 'dairy'] },
    { name: 'Veg Sandwich', description: 'Toasted multigrain bread with cucumber, tomato, beetroot and mint chutney.', price: 45, category: MenuCategory.BREAKFAST, isVeg: true, servingSize: '1 sandwich (180 g)', calories: 260, proteinG: 8, carbsG: 38, fatG: 8, fiberG: 5, sugarG: 6, sodiumMg: 520, ingredients: ['multigrain bread', 'cucumber', 'tomato', 'beetroot', 'mint chutney'], allergens: ['gluten'] },
    { name: 'Egg Omelette Toast', description: 'Two-egg masala omelette with buttered toast.', price: 55, category: MenuCategory.BREAKFAST, isVeg: false, spiceLevel: 1, servingSize: '1 plate (210 g)', calories: 340, proteinG: 18, carbsG: 24, fatG: 19, fiberG: 2, sugarG: 3, sodiumMg: 580, ingredients: ['eggs', 'bread', 'onion', 'green chilli', 'butter'], allergens: ['eggs', 'gluten', 'dairy'] },
    // Lunch
    { name: 'Rajma Chawal', description: 'Slow-cooked kidney bean curry over steamed basmati rice.', price: 90, category: MenuCategory.LUNCH, isVeg: true, spiceLevel: 2, servingSize: '1 plate (380 g)', calories: 520, proteinG: 17, carbsG: 88, fatG: 10, fiberG: 12, sugarG: 5, sodiumMg: 690, ingredients: ['kidney beans', 'basmati rice', 'tomato', 'onion', 'ginger', 'garlic', 'garam masala'], stock: 40 },
    { name: 'Paneer Butter Masala with Roti', description: 'Cottage cheese in a creamy tomato gravy with two tandoori rotis.', price: 130, category: MenuCategory.LUNCH, isVeg: true, spiceLevel: 2, servingSize: '1 plate (350 g)', calories: 640, proteinG: 24, carbsG: 54, fatG: 36, fiberG: 6, sugarG: 9, sodiumMg: 880, ingredients: ['paneer', 'tomato', 'cream', 'butter', 'cashew', 'wheat flour'], allergens: ['dairy', 'gluten', 'cashew'], stock: 30 },
    { name: 'Chicken Biryani', description: 'Fragrant dum biryani with tender chicken, served with raita.', price: 150, category: MenuCategory.LUNCH, isVeg: false, spiceLevel: 3, servingSize: '1 plate (420 g)', calories: 690, proteinG: 32, carbsG: 82, fatG: 24, fiberG: 4, sugarG: 4, sodiumMg: 960, ingredients: ['basmati rice', 'chicken', 'yogurt', 'fried onion', 'saffron', 'mint'], allergens: ['dairy'], stock: 25 },
    { name: 'Veg Thali', description: 'Dal, seasonal sabzi, rice, two rotis, salad and a sweet.', price: 110, category: MenuCategory.LUNCH, isVeg: true, spiceLevel: 1, servingSize: '1 thali (550 g)', calories: 720, proteinG: 22, carbsG: 112, fatG: 20, fiberG: 14, sugarG: 11, sodiumMg: 1020, ingredients: ['dal', 'rice', 'wheat flour', 'seasonal vegetables', 'curd'], allergens: ['gluten', 'dairy'] },
    { name: 'Chole Bhature', description: 'Spicy chickpea curry with two fluffy fried breads.', price: 95, category: MenuCategory.LUNCH, isVeg: true, spiceLevel: 2, servingSize: '1 plate (400 g)', calories: 760, proteinG: 20, carbsG: 96, fatG: 32, fiberG: 11, sugarG: 6, sodiumMg: 940, ingredients: ['chickpeas', 'refined flour', 'onion', 'tomato', 'tea masala'], allergens: ['gluten'] },
    { name: 'Grilled Chicken Wrap', description: 'Whole-wheat wrap with grilled chicken, crunchy slaw and garlic mayo.', price: 120, category: MenuCategory.LUNCH, isVeg: false, spiceLevel: 1, servingSize: '1 wrap (260 g)', calories: 450, proteinG: 30, carbsG: 42, fatG: 17, fiberG: 5, sugarG: 4, sodiumMg: 810, ingredients: ['whole-wheat tortilla', 'chicken breast', 'cabbage', 'carrot', 'garlic mayo'], allergens: ['gluten', 'eggs'] },
    { name: 'Veg Fried Rice', description: 'Wok-tossed rice with crunchy vegetables and soy.', price: 80, category: MenuCategory.LUNCH, isVeg: true, spiceLevel: 1, servingSize: '1 plate (320 g)', calories: 430, proteinG: 9, carbsG: 78, fatG: 9, fiberG: 4, sugarG: 3, sodiumMg: 880, ingredients: ['rice', 'carrot', 'beans', 'spring onion', 'soy sauce'], allergens: ['soy'] },
    // Snacks
    { name: 'Samosa (2 pcs)', description: 'Crisp pastry parcels with spiced potato and peas, with tamarind chutney.', price: 30, category: MenuCategory.SNACKS, isVeg: true, spiceLevel: 2, servingSize: '2 pieces (140 g)', calories: 340, proteinG: 6, carbsG: 38, fatG: 18, fiberG: 4, sugarG: 3, sodiumMg: 520, ingredients: ['refined flour', 'potato', 'peas', 'cumin', 'coriander'], allergens: ['gluten'], stock: 60 },
    { name: 'Vada Pav', description: 'Mumbai-style spiced potato fritter in a soft bun with dry garlic chutney.', price: 25, category: MenuCategory.SNACKS, isVeg: true, spiceLevel: 2, servingSize: '1 piece (130 g)', calories: 290, proteinG: 7, carbsG: 41, fatG: 11, fiberG: 3, sugarG: 3, sodiumMg: 480, ingredients: ['potato', 'gram flour', 'bun', 'garlic', 'green chilli'], allergens: ['gluten'] },
    { name: 'French Fries', description: 'Skin-on fries tossed in peri-peri seasoning.', price: 60, category: MenuCategory.SNACKS, isVeg: true, spiceLevel: 1, servingSize: '1 portion (150 g)', calories: 410, proteinG: 5, carbsG: 52, fatG: 20, fiberG: 4, sugarG: 1, sodiumMg: 540, ingredients: ['potato', 'vegetable oil', 'peri-peri seasoning'] },
    { name: 'Paneer Tikka Roll', description: 'Smoky paneer tikka and mint chutney rolled in a flaky paratha.', price: 85, category: MenuCategory.SNACKS, isVeg: true, spiceLevel: 2, servingSize: '1 roll (230 g)', calories: 430, proteinG: 17, carbsG: 44, fatG: 20, fiberG: 3, sugarG: 4, sodiumMg: 700, ingredients: ['paneer', 'bell pepper', 'onion', 'wheat flour', 'mint chutney'], allergens: ['dairy', 'gluten'] },
    { name: 'Chicken Momos (6 pcs)', description: 'Steamed dumplings with chicken and ginger, with fiery red chutney.', price: 80, category: MenuCategory.SNACKS, isVeg: false, spiceLevel: 2, servingSize: '6 pieces (180 g)', calories: 310, proteinG: 17, carbsG: 36, fatG: 10, fiberG: 2, sugarG: 2, sodiumMg: 640, ingredients: ['refined flour', 'chicken', 'ginger', 'garlic', 'spring onion'], allergens: ['gluten', 'soy'], stock: 18 },
    { name: 'Masala Maggi', description: 'Instant noodles cooked with onions, tomato and masala.', price: 40, category: MenuCategory.SNACKS, isVeg: true, spiceLevel: 2, servingSize: '1 bowl (250 g)', calories: 360, proteinG: 8, carbsG: 54, fatG: 12, fiberG: 2, sugarG: 3, sodiumMg: 1100, ingredients: ['wheat noodles', 'onion', 'tomato', 'masala'], allergens: ['gluten'] },
    { name: 'Fruit Chaat', description: 'Seasonal fruit with chaat masala and lime.', price: 50, category: MenuCategory.SNACKS, isVeg: true, servingSize: '1 bowl (200 g)', calories: 120, proteinG: 2, carbsG: 29, fatG: 1, fiberG: 4, sugarG: 22, sodiumMg: 90, ingredients: ['apple', 'banana', 'pomegranate', 'chaat masala', 'lime'] },
    // Beverages
    { name: 'Masala Chai', description: 'Kettle-brewed milk tea with ginger and cardamom.', price: 15, category: MenuCategory.BEVERAGES, isVeg: true, servingSize: '1 cup (150 ml)', calories: 90, proteinG: 3, carbsG: 13, fatG: 3, sugarG: 11, sodiumMg: 40, ingredients: ['tea leaves', 'milk', 'sugar', 'ginger', 'cardamom'], allergens: ['dairy'] },
    { name: 'Filter Coffee', description: 'Strong South Indian decoction with frothy milk.', price: 25, category: MenuCategory.BEVERAGES, isVeg: true, servingSize: '1 cup (150 ml)', calories: 80, proteinG: 3, carbsG: 11, fatG: 3, sugarG: 10, sodiumMg: 35, ingredients: ['coffee-chicory decoction', 'milk', 'sugar'], allergens: ['dairy'] },
    { name: 'Cold Brew Artisan Coffee', description: 'Slow-steeped organic coffee with a splash of oat milk.', price: 90, category: MenuCategory.BEVERAGES, isVeg: true, servingSize: '1 glass (300 ml)', calories: 60, proteinG: 1, carbsG: 9, fatG: 2, sugarG: 6, sodiumMg: 25, ingredients: ['coffee', 'oat milk', 'ice'], allergens: ['gluten'] },
    { name: 'Fresh Lime Soda', description: 'Sweet-salty lime soda over ice.', price: 30, category: MenuCategory.BEVERAGES, isVeg: true, servingSize: '1 glass (300 ml)', calories: 70, proteinG: 0, carbsG: 18, fatG: 0, sugarG: 16, sodiumMg: 180, ingredients: ['lime', 'soda', 'sugar', 'black salt'] },
    { name: 'Mango Lassi', description: 'Thick yogurt shake with Alphonso mango pulp.', price: 55, category: MenuCategory.BEVERAGES, isVeg: true, servingSize: '1 glass (300 ml)', calories: 240, proteinG: 7, carbsG: 38, fatG: 6, sugarG: 34, sodiumMg: 90, ingredients: ['yogurt', 'mango pulp', 'sugar', 'cardamom'], allergens: ['dairy'], stock: 3 },
    { name: 'Cold Coffee', description: 'Blended iced coffee with a scoop of vanilla ice cream.', price: 70, category: MenuCategory.BEVERAGES, isVeg: true, servingSize: '1 glass (350 ml)', calories: 280, proteinG: 7, carbsG: 38, fatG: 11, sugarG: 32, sodiumMg: 110, ingredients: ['coffee', 'milk', 'ice cream', 'sugar'], allergens: ['dairy'] },
    // Desserts
    { name: 'Fudge Walnut Brownie', description: 'Rich dark chocolate baked brownie topped with walnuts.', price: 70, category: MenuCategory.DESSERTS, isVeg: true, servingSize: '1 piece (80 g)', calories: 360, proteinG: 5, carbsG: 42, fatG: 20, fiberG: 3, sugarG: 30, sodiumMg: 140, ingredients: ['dark chocolate', 'butter', 'flour', 'sugar', 'walnuts', 'eggs'], allergens: ['gluten', 'dairy', 'eggs', 'walnuts'] },
    { name: 'Gulab Jamun (2 pcs)', description: 'Soft khoya dumplings soaked in cardamom syrup.', price: 40, category: MenuCategory.DESSERTS, isVeg: true, servingSize: '2 pieces (90 g)', calories: 300, proteinG: 5, carbsG: 46, fatG: 11, sugarG: 38, sodiumMg: 60, ingredients: ['khoya', 'refined flour', 'sugar', 'cardamom'], allergens: ['dairy', 'gluten'] },
    { name: 'Ice Cream Sundae', description: 'Two scoops of vanilla with chocolate sauce and sprinkles.', price: 80, category: MenuCategory.DESSERTS, isVeg: true, servingSize: '1 cup (180 g)', calories: 330, proteinG: 5, carbsG: 44, fatG: 15, sugarG: 38, sodiumMg: 85, ingredients: ['ice cream', 'chocolate sauce', 'sprinkles'], allergens: ['dairy'] },
    // Special
    { name: 'Chef’s Special Thali', description: 'Weekend feast: paneer, dal makhani, jeera rice, naan and kheer.', price: 180, category: MenuCategory.SPECIAL, isVeg: true, spiceLevel: 1, servingSize: '1 thali (650 g)', calories: 980, proteinG: 30, carbsG: 130, fatG: 38, fiberG: 12, sugarG: 22, sodiumMg: 1250, ingredients: ['paneer', 'black lentils', 'rice', 'refined flour', 'milk', 'cream'], allergens: ['dairy', 'gluten'], stock: 12 },
    { name: 'Tandoori Chicken Platter', description: 'Half tandoori chicken with mint chutney, onion salad and naan.', price: 210, category: MenuCategory.SPECIAL, isVeg: false, spiceLevel: 3, servingSize: '1 platter (480 g)', calories: 820, proteinG: 58, carbsG: 46, fatG: 42, fiberG: 3, sugarG: 4, sodiumMg: 1180, ingredients: ['chicken', 'yogurt', 'kashmiri chilli', 'refined flour'], allergens: ['dairy', 'gluten'], stock: 10 },
    // Unavailable / retired, so the "off the menu" states have data too
    { name: 'Pav Bhaji', description: 'Buttery mashed vegetable curry with toasted pav. Back next week.', price: 75, category: MenuCategory.SNACKS, isVeg: true, spiceLevel: 2, servingSize: '1 plate (320 g)', calories: 540, proteinG: 12, carbsG: 72, fatG: 22, fiberG: 8, sugarG: 9, sodiumMg: 900, ingredients: ['potato', 'cauliflower', 'peas', 'tomato', 'butter', 'pav'], allergens: ['gluten', 'dairy'], isAvailable: false },
    { name: 'Seasonal Mango Cheesecake', description: 'Retired seasonal dessert.', price: 120, category: MenuCategory.DESSERTS, isVeg: true, servingSize: '1 slice (120 g)', calories: 410, proteinG: 6, carbsG: 44, fatG: 24, sugarG: 32, ingredients: ['cream cheese', 'mango', 'biscuit base'], allergens: ['dairy', 'gluten'], isAvailable: false, isArchived: true },
  ];

  const menu: Record<string, { id: string; price: number }> = {};
  for (const [i, m] of menuSeed.entries()) {
    const slug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const created = await prisma.menuItem.create({
      data: {
        name: m.name,
        description: m.description,
        price: m.price,
        category: m.category,
        isVeg: m.isVeg,
        spiceLevel: m.spiceLevel ?? 0,
        imageUrl: photo(slug),
        galleryUrls: i % 3 === 0 ? [photo(slug, 2), photo(slug, 3)] : i % 3 === 1 ? [photo(slug, 2)] : [],
        servingSize: m.servingSize,
        calories: m.calories,
        proteinG: m.proteinG,
        carbsG: m.carbsG,
        fatG: m.fatG,
        fiberG: m.fiberG,
        sugarG: m.sugarG,
        sodiumMg: m.sodiumMg,
        ingredients: m.ingredients,
        allergens: m.allergens ?? [],
        stock: m.stock,
        isAvailable: m.isAvailable ?? true,
        isArchived: m.isArchived ?? false,
      },
    });
    menu[m.name] = { id: created.id, price: created.price };
  }

  await prisma.offer.create({
    data: {
      title: 'Chef Special Combo 15% OFF',
      description: 'Get Cold Brew Coffee + Chicken Biryani for 15% off',
      code: 'CAMPUS15',
      discountPercent: 15,
      isBanner: true,
    },
  });

  // A handful of extra students so the order history and reviews look like a real campus.
  const extraStudents = [];
  for (const [n, name] of ['Priya Sharma', 'Rohan Mehta', 'Ananya Iyer', 'Kabir Singh'].entries()) {
    extraStudents.push(
      await prisma.user.create({
        data: {
          name,
          email: `student${n + 2}@smartcampus.edu`,
          passwordHash,
          role: Role.STUDENT,
          phone: `+91-98000-0010${n}`,
        },
      })
    );
  }
  const customers = [studentUser, ...extraStudents];

  // Order history: ~2 weeks of orders in every status. Today's orders are in-flight so the
  // staff queue has live work; older ones are mostly collected, with a few cancellations.
  type SeedOrder = { customer: number; daysAgo: number; hour: number; status: OrderStatus; type?: OrderType; table?: string; note?: string; lines: Array<[string, number]> };
  const orderSeed: SeedOrder[] = [
    { customer: 0, daysAgo: 0, hour: 9, status: OrderStatus.PREPARING, note: 'Extra napkins please!', lines: [['Cold Brew Artisan Coffee', 1], ['Chicken Biryani', 1]] },
    { customer: 1, daysAgo: 0, hour: 9, status: OrderStatus.PLACED, lines: [['Masala Dosa', 2], ['Filter Coffee', 2]] },
    { customer: 2, daysAgo: 0, hour: 10, status: OrderStatus.ACCEPTED, type: OrderType.DINE_IN, table: 'T4', lines: [['Veg Thali', 1], ['Fresh Lime Soda', 1]] },
    { customer: 3, daysAgo: 0, hour: 10, status: OrderStatus.READY, lines: [['Samosa (2 pcs)', 2], ['Masala Chai', 2]] },
    { customer: 4, daysAgo: 0, hour: 8, status: OrderStatus.COLLECTED, lines: [['Poha', 1], ['Masala Chai', 1]] },
    { customer: 1, daysAgo: 0, hour: 8, status: OrderStatus.CANCELLED, note: 'Changed my mind', lines: [['Egg Omelette Toast', 1]] },
    { customer: 0, daysAgo: 1, hour: 13, status: OrderStatus.COLLECTED, lines: [['Rajma Chawal', 1], ['Mango Lassi', 1]] },
    { customer: 2, daysAgo: 1, hour: 13, status: OrderStatus.COLLECTED, type: OrderType.DINE_IN, table: 'T2', lines: [['Paneer Butter Masala with Roti', 1], ['Gulab Jamun (2 pcs)', 1]] },
    { customer: 3, daysAgo: 1, hour: 16, status: OrderStatus.COLLECTED, lines: [['Chicken Momos (6 pcs)', 1], ['Cold Coffee', 1]] },
    { customer: 4, daysAgo: 1, hour: 9, status: OrderStatus.COLLECTED, lines: [['Aloo Paratha with Curd', 2]] },
    { customer: 1, daysAgo: 2, hour: 12, status: OrderStatus.COLLECTED, lines: [['Chicken Biryani', 2], ['Fresh Lime Soda', 2]] },
    { customer: 0, daysAgo: 2, hour: 17, status: OrderStatus.COLLECTED, lines: [['Vada Pav', 2], ['Masala Chai', 1], ['Samosa (2 pcs)', 1]] },
    { customer: 2, daysAgo: 3, hour: 13, status: OrderStatus.COLLECTED, lines: [['Veg Thali', 1], ['Fudge Walnut Brownie', 1]] },
    { customer: 3, daysAgo: 3, hour: 9, status: OrderStatus.CANCELLED, lines: [['Masala Dosa', 1]] },
    { customer: 4, daysAgo: 4, hour: 14, status: OrderStatus.COLLECTED, lines: [['Grilled Chicken Wrap', 1], ['Cold Brew Artisan Coffee', 1]] },
    { customer: 0, daysAgo: 4, hour: 12, status: OrderStatus.COLLECTED, lines: [['Chole Bhature', 1], ['Mango Lassi', 1]] },
    { customer: 1, daysAgo: 5, hour: 11, status: OrderStatus.COLLECTED, lines: [['Paneer Tikka Roll', 2], ['French Fries', 1]] },
    { customer: 2, daysAgo: 6, hour: 13, status: OrderStatus.COLLECTED, type: OrderType.DINE_IN, table: 'T7', lines: [['Chef’s Special Thali', 1], ['Ice Cream Sundae', 1]] },
    { customer: 3, daysAgo: 7, hour: 13, status: OrderStatus.COLLECTED, lines: [['Tandoori Chicken Platter', 1]] },
    { customer: 4, daysAgo: 8, hour: 10, status: OrderStatus.COLLECTED, lines: [['Masala Maggi', 2], ['Cold Coffee', 2]] },
    { customer: 0, daysAgo: 9, hour: 13, status: OrderStatus.COLLECTED, lines: [['Veg Fried Rice', 1], ['Fruit Chaat', 1]] },
    { customer: 1, daysAgo: 11, hour: 9, status: OrderStatus.COLLECTED, lines: [['Veg Sandwich', 2], ['Filter Coffee', 2]] },
    { customer: 2, daysAgo: 13, hour: 15, status: OrderStatus.COLLECTED, lines: [['French Fries', 2], ['Fresh Lime Soda', 2]] },
  ];

  for (const o of orderSeed) {
    const placedAt = new Date();
    placedAt.setDate(placedAt.getDate() - o.daysAgo);
    placedAt.setHours(o.hour, 15, 0, 0);
    // Keep "today" orders in the past even when the seed runs early in the day.
    if (placedAt.getTime() > Date.now()) placedAt.setTime(Date.now() - 20 * 60_000);

    const lines = o.lines.map(([name, quantity]) => ({ menuItemId: menu[name].id, quantity, unitPrice: menu[name].price }));
    const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const finishedAt = new Date(placedAt.getTime() + 18 * 60_000);

    const created = await prisma.order.create({
      data: {
        userId: customers[o.customer].id,
        orderType: o.type ?? OrderType.PICKUP,
        tableNumber: o.table,
        orderToken: 'PENDING',
        status: o.status,
        totalAmount: total,
        pickupTime: o.type === OrderType.DINE_IN ? undefined : new Date(placedAt.getTime() + 20 * 60_000),
        note: o.note,
        createdAt: placedAt,
        updatedAt: o.status === OrderStatus.PLACED ? placedAt : finishedAt,
        orderItems: { create: lines },
      },
    });
    // orderToken is derived from the DB-assigned orderNumber, mirroring how
    // cafeteria.service.ts generates it for real orders.
    await prisma.order.update({
      where: { id: created.id },
      data: { orderToken: `#ORD-${String(created.orderNumber).padStart(4, '0')}`, updatedAt: o.status === OrderStatus.PLACED ? placedAt : finishedAt },
    });
  }

  // Reviews from customers who collected the dish, then roll them up into each item's rating.
  const reviewSeed: Array<[number, string, number, string | null]> = [
    [0, 'Rajma Chawal', 5, 'Tastes like home. Generous portion.'],
    [0, 'Mango Lassi', 4, 'Thick and creamy, a bit sweet.'],
    [0, 'Vada Pav', 5, 'Spot on, nice and spicy.'],
    [2, 'Paneer Butter Masala with Roti', 4, 'Rich gravy, rotis could be softer.'],
    [2, 'Veg Thali', 5, 'Great value for the price.'],
    [3, 'Chicken Momos (6 pcs)', 3, 'Good, but the chutney was too hot for me.'],
    [3, 'Tandoori Chicken Platter', 5, 'Perfectly charred and juicy.'],
    [4, 'Grilled Chicken Wrap', 4, null],
    [4, 'Masala Maggi', 5, 'Late-night classic.'],
    [1, 'Chicken Biryani', 5, 'Best thing on the menu.'],
    [1, 'Paneer Tikka Roll', 4, 'Smoky and filling.'],
    [2, 'Chef’s Special Thali', 5, 'Worth every rupee.'],
    [4, 'Cold Brew Artisan Coffee', 4, 'Smooth, not bitter.'],
    [0, 'Chole Bhature', 3, 'Bhature were a little oily.'],
  ];
  for (const [who, dish, rating, comment] of reviewSeed) {
    await prisma.menuReview.create({ data: { menuItemId: menu[dish].id, userId: customers[who].id, rating, comment } });
  }
  const reviewed = await prisma.menuReview.groupBy({ by: ['menuItemId'], _avg: { rating: true }, _count: { _all: true } });
  for (const r of reviewed) {
    await prisma.menuItem.update({
      where: { id: r.menuItemId },
      data: { rating: Math.round((r._avg.rating ?? 4.5) * 10) / 10, reviewCount: r._count?._all ?? 0 },
    });
  }

  // A few notifications for the demo student so the mobile inbox isn't empty (one unread).
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
  const todaysReady = await prisma.order.findFirst({ where: { userId: studentUser.id, status: OrderStatus.PREPARING } });
  await prisma.notification.createMany({
    data: [
      {
        userId: studentUser.id,
        type: 'ORDER',
        title: 'Order update',
        body: `${todaysReady?.orderToken ?? 'Your order'} is now preparing`,
        data: todaysReady ? { orderId: todaysReady.id, status: 'PREPARING' } : undefined,
        read: false,
        createdAt: minutesAgo(8),
      },
      { userId: studentUser.id, type: 'BOOKING', title: 'Room booked', body: 'Your room booking is confirmed.', read: true, createdAt: minutesAgo(60 * 5) },
      { userId: studentUser.id, type: 'CONSULTATION', title: 'Consultation update', body: 'Your request is now requested', read: true, createdAt: minutesAgo(60 * 26) },
      { userId: studentUser.id, type: 'SYSTEM', title: 'Welcome to Smart Campus', body: 'Book rooms, order food and get help from one place.', read: true, createdAt: minutesAgo(60 * 24 * 6) },
    ],
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
