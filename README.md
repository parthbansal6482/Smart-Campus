# Smart Campus Management System

A unified smart campus platform connecting students, faculty, staff, medical responders, and administrators.

## Monorepo / Multi-Package Structure

```
Smart Campus/
├── backend/            # Node.js + Express + TypeScript + Prisma (PostgreSQL) + Socket.io
├── web-dashboard/      # React + Vite + TypeScript + Tailwind CSS (Admin & Staff)
├── mobile-app/         # React Native (Expo) + TypeScript (Students & Faculty)
```

## Core Modules

1. **Smart Classroom Management** — Room booking, real-time availability, facility automation (AC/lights/projector).
2. **Emergency Health Assistance** — One-tap emergency dispatch, nearest building geolocation, responder live tracking.
3. **Smart Cafeteria Food Ordering** — Daily menu, pickup & dine-in orders, real-time status updates, kitchen management.

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update DATABASE_URL in .env
npx prisma db push # or npx prisma migrate dev
npm run db:seed
npm run dev
```

### 2. Web Dashboard Setup (Admin & Cafeteria Staff)
```bash
cd web-dashboard
npm install
npm run dev
```

### 3. Mobile App Setup (Students & Faculty)
```bash
cd mobile-app
npm install
npm start
```
