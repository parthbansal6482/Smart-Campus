-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConsultationType" AS ENUM ('CHAT', 'CALLBACK', 'APPOINTMENT');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('REPORTED', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'HANDLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmergencyTag" AS ENUM ('FAINTED', 'INJURY', 'ALLERGIC_REACTION', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicineCategory" AS ENUM ('PAIN_RELIEF', 'FIRST_AID', 'COLD_FEVER', 'PRESCRIPTION_ONLY', 'GENERAL');

-- CreateEnum
CREATE TYPE "MedicineOrderStatus" AS ENUM ('PLACED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MenuCategory" AS ENUM ('BREAKFAST', 'LUNCH', 'SNACKS', 'BEVERAGES', 'DESSERTS', 'SPECIAL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('PICKUP', 'DINE_IN');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'FACULTY', 'CAFETERIA_STAFF', 'MEDICAL_STAFF', 'AMBULANCE_RESPONDER', 'ADMIN');

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "floor_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "ConsultationType" NOT NULL DEFAULT 'CALLBACK',
    "status" "ConsultationStatus" NOT NULL DEFAULT 'REQUESTED',
    "slot_time" TIMESTAMP(3),
    "note" TEXT,
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergencies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "building_id" TEXT,
    "tag" "EmergencyTag" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "status" "EmergencyStatus" NOT NULL DEFAULT 'REPORTED',
    "responder_id" TEXT,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "emergencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_order_items" (
    "id" TEXT NOT NULL,
    "medicine_order_id" TEXT NOT NULL,
    "medicine_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "medicine_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "status" "MedicineOrderStatus" NOT NULL DEFAULT 'PLACED',
    "pickup_or_delivery" TEXT NOT NULL DEFAULT 'PICKUP',
    "delivery_address" TEXT,
    "prescription_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MedicineCategory" NOT NULL DEFAULT 'GENERAL',
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 50,
    "requires_prescription" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "category" "MenuCategory" NOT NULL DEFAULT 'SNACKS',
    "is_veg" BOOLEAN NOT NULL DEFAULT true,
    "spice_level" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "discount_percent" DOUBLE PRECISION NOT NULL,
    "is_banner" BOOLEAN NOT NULL DEFAULT true,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_type" "OrderType" NOT NULL DEFAULT 'PICKUP',
    "table_number" TEXT,
    "order_token" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PLACED',
    "pickup_time" TIMESTAMP(3),
    "total_amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "room_number" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "has_ac" BOOLEAN NOT NULL DEFAULT true,
    "has_projector" BOOLEAN NOT NULL DEFAULT true,
    "is_occupied" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_room_id_start_time_end_time_idx" ON "bookings"("room_id" ASC, "start_time" ASC, "end_time" ASC);

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status" ASC);

-- CreateIndex
CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "buildings_code_key" ON "buildings"("code" ASC);

-- CreateIndex
CREATE INDEX "consultations_status_idx" ON "consultations"("status" ASC);

-- CreateIndex
CREATE INDEX "consultations_user_id_idx" ON "consultations"("user_id" ASC);

-- CreateIndex
CREATE INDEX "emergencies_reported_at_idx" ON "emergencies"("reported_at" ASC);

-- CreateIndex
CREATE INDEX "emergencies_status_idx" ON "emergencies"("status" ASC);

-- CreateIndex
CREATE INDEX "emergencies_user_id_idx" ON "emergencies"("user_id" ASC);

-- CreateIndex
CREATE INDEX "medicine_orders_status_idx" ON "medicine_orders"("status" ASC);

-- CreateIndex
CREATE INDEX "medicine_orders_user_id_idx" ON "medicine_orders"("user_id" ASC);

-- CreateIndex
CREATE INDEX "medicines_category_idx" ON "medicines"("category" ASC);

-- CreateIndex
CREATE INDEX "menu_items_category_idx" ON "menu_items"("category" ASC);

-- CreateIndex
CREATE INDEX "menu_items_is_available_idx" ON "menu_items"("is_available" ASC);

-- CreateIndex
CREATE INDEX "menu_items_is_veg_idx" ON "menu_items"("is_veg" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "offers_code_key" ON "offers"("code" ASC);

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id" ASC);

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at" ASC);

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status" ASC);

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id" ASC);

-- CreateIndex
CREATE INDEX "rooms_building_id_idx" ON "rooms"("building_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_building_id_room_number_key" ON "rooms"("building_id" ASC, "room_number" ASC);

-- CreateIndex
CREATE INDEX "rooms_is_occupied_idx" ON "rooms"("is_occupied" ASC);

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email" ASC);

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role" ASC);

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergencies" ADD CONSTRAINT "emergencies_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergencies" ADD CONSTRAINT "emergencies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_order_items" ADD CONSTRAINT "medicine_order_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_order_items" ADD CONSTRAINT "medicine_order_items_medicine_order_id_fkey" FOREIGN KEY ("medicine_order_id") REFERENCES "medicine_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_orders" ADD CONSTRAINT "medicine_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
