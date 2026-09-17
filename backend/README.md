# Smart Campus — Backend API & Real-time Server

Modular Express.js + TypeScript backend powered by PostgreSQL (Prisma ORM) and Socket.io.

## Features

- **Auth & RBAC**: JWT-based authentication with role-based access control (`STUDENT`, `FACULTY`, `STAFF`, `ADMIN`, `RESPONDER`).
- **Smart Classroom Management**: Building & room management, room occupancy, equipment control (AC, projector), and reservation conflict prevention.
- **Emergency Health Assistance**: One-tap emergency dispatch, nearest building geolocation computation, live responder location streaming via WebSockets.
- **Smart Cafeteria Ordering**: Menu management, order placement (pickup / dine-in), inventory status, and real-time kitchen notifications.
- **Security & Reliability**: Helmet, CORS, rate limiting, centralized error handling, and Zod validation.

## Environment Variables

Copy `.env.example` to `.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_campus?schema=public"
JWT_SECRET="smart-campus-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Push schema to PostgreSQL database
npx prisma db push

# 3. Seed database with initial users and data
npm run db:seed

# 4. Start development server
npm run dev
```

## Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@smartcampus.edu` | `Password@123` |
| Faculty | `faculty@smartcampus.edu` | `Password@123` |
| Student | `student@smartcampus.edu` | `Password@123` |
| Cafeteria Staff | `staff@smartcampus.edu` | `Password@123` |
| Medical Responder | `responder@smartcampus.edu` | `Password@123` |

## API Routes Overview

- **Auth:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- **Users:** `GET /api/v1/users`, `GET /api/v1/users/:id`, `PATCH /api/v1/users/:id/role`
- **Classrooms:** `GET /api/v1/classrooms/buildings`, `GET /api/v1/classrooms/rooms`, `POST /api/v1/classrooms/bookings`, `PATCH /api/v1/classrooms/rooms/:id/facilities`
- **Emergency:** `POST /api/v1/emergency/trigger`, `GET /api/v1/emergency/active`, `PATCH /api/v1/emergency/:id/status`
- **Cafeteria:** `GET /api/v1/cafeteria/menu`, `POST /api/v1/cafeteria/orders`, `PATCH /api/v1/cafeteria/orders/:id/status`
