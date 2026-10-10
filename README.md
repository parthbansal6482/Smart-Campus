# Smart Campus Management System

A unified smart campus platform connecting students, faculty, cafeteria staff, medical responders, and administrators through **ONE Mobile App**, **ONE Web Dashboard**, and a **Modular Backend**.

## Architecture & Structure

```
smart-campus/
├── backend/            # Express + TypeScript + PostgreSQL (Prisma) + Socket.io
│   └── src/modules/
│       ├── classroom/       # Room booking & HVAC/AV facility automation
│       ├── medical-help/    # Emergency dispatch, medicine store, consultations
│       ├── cafeteria/       # Menu catalog (veg/non-veg), order tokens, kitchen queue
│       ├── auth/            # Shared login/signup, JWT tokens
│       └── users/           # Shared user accounts & role management
│
├── web-dashboard/      # ONE React App for all staff and admin roles
│   └── src/
│       ├── layouts/         # Shared dashboard shell with role-filtered sidebar
│       └── pages/           # Overview (Admin), Classroom, Medical Help, Cafeteria
│
└── mobile-app/         # ONE Expo React Native App (SDK 57) for Students & Faculty
    └── src/
        ├── navigation/      # 5 Bottom Tabs: Home, Classrooms, Medical, Cafeteria, Profile
        └── components/      # Floating Emergency SOS Action Button
```

---

## Role-Based Dashboard Matrix

| Role | Accessible Dashboard Modules |
|---|---|
| **`ADMIN`** | Full access to all modules + Cross-module overview & analytics |
| **`CAFETERIA_STAFF`** | Cafeteria section (Live kitchen queue, Menu catalog, Sales) |
| **`MEDICAL_STAFF`** | Medical Help section (Ambulance dispatches, Pharmacy stock, Orders, Consultations) |
| **`AMBULANCE_RESPONDER`** | Medical Help section (Live emergency dispatches) |
| **`FACULTY`** | Classroom module & emergency dispatch button |
| **`STUDENT`** | Mobile App user |

---

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Set DATABASE_URL and DIRECT_URL (Supabase or local PostgreSQL)
npx prisma db push
npm run db:seed
npm run dev
# Server runs on http://localhost:5001
```

### 2. Web Dashboard Setup (Staff & Admin)
```bash
cd web-dashboard
npm install
npm run dev
# Dashboard runs on http://localhost:5173
```

### 3. Mobile App Setup (Students & Faculty)
```bash
cd mobile-app
npm install --legacy-peer-deps
npm start
# Runs on Expo SDK 57 (Compatible with Expo Go app)
```

---

## Emergency Location Tracking

Live GPS sharing during an emergency. The web dashboard polls the trail every 10s and shows the latest fix on each active incident.

- `POST /api/v1/medical-help/emergencies/:id/location` — reporter streams a GPS fix (`latitude`, `longitude`, optional `accuracyM`).
- `GET /api/v1/medical-help/emergencies/:id/location` — reporter or responder reads the trail.
- Each ping is also emitted as `emergency:reporter_location_updated` to the `emergency-<id>` socket room.
- Limits: one ping per second per incident (429 otherwise); the trail is capped at 2000 pings.
- Mobile: `mobile-app/src/services/emergencyTracking.ts`.
- Requires the `emergency_location_pings` migration: `cd backend && npx prisma migrate deploy`.

## Seed Accounts (`Password@123`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@smartcampus.edu` | `Password@123` |
| Faculty | `faculty@smartcampus.edu` | `Password@123` |
| Student | `student@smartcampus.edu` | `Password@123` |
| Cafeteria Staff | `cafeteria@smartcampus.edu` | `Password@123` |
| Medical Staff | `medical@smartcampus.edu` | `Password@123` |
| Ambulance Responder | `responder@smartcampus.edu` | `Password@123` |
