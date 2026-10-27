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

Live GPS sharing during an emergency. The web dashboard polls the trail every 10s and shows the latest fix on each active incident. The mobile app continues sharing in the background while an incident is active, including after the SOS screen is closed or the JavaScript runtime is recreated.

- `POST /api/v1/medical-help/emergencies/:id/location` — reporter streams a GPS fix (`latitude`, `longitude`, optional `accuracyM`).
- `GET /api/v1/medical-help/emergencies/:id/location` — reporter or responder reads the trail.
- Each ping is also emitted as `emergency:reporter_location_updated` to the `emergency-<id>` socket room.
- Limits: one ping per second per incident (429 otherwise); the trail is capped at 2000 pings.
- Mobile: `mobile-app/src/services/emergencyTracking.ts`. The app requests foreground and background location permission, uses an Expo native location task when available, and falls back to foreground updates when background permission is declined. The active incident id is persisted locally and cleared only when the incident is cancelled or handled.
- Requires the `emergency_location_pings` migration: `cd backend && npx prisma migrate deploy`.

## Cafeteria

- **Menu** — `GET /api/v1/cafeteria/menu` supports `category`, `isVeg`, `search`, `sort` (`name|price_asc|price_desc|rating|popular|calories`), `maxCalories`, `excludeAllergens=dairy,nuts` and `inStockOnly`. Items carry photos, nutrition facts, ingredients and allergens.
- **Stock** — optional per dish (`stock`). Orders claim portions atomically, selling the last one marks the dish unavailable, and cancelling gives them back. Leave blank to not track.
- **Orders** — status only moves forward (`PLACED → ACCEPTED → PREPARING → READY → COLLECTED`; steps may be skipped) and can be cancelled until collected. Pickup times must be within the next 24h. If kitchen hours are set (Settings page, or `CAFETERIA_OPENS_AT` / `CAFETERIA_CLOSES_AT` as the default), orders placed while the kitchen is closed, and pickup times outside the hours, are refused.
- **Order history** — `GET /cafeteria/orders` supports `status`, `search` (order number, or customer name for staff), `from`/`to` and `page`/`limit`. `GET /cafeteria/orders/:id/reorder` returns a past order's lines with today's price and availability; the mobile app uses it for "Order again".
- **Reviews** — `GET /cafeteria/menu/:id/reviews` (public), `GET|PUT|DELETE /cafeteria/menu/:id/reviews/mine`. Only customers who collected an order containing the dish can review it; a dish's `rating`/`reviewCount` are recomputed on every change.
- **Moderation & restore** — staff can delete any review (`DELETE /cafeteria/menu/:id/reviews/:reviewId`), remove a dish, list removed dishes (`GET /cafeteria/menu?includeArchived=true`, staff only) and restore them (`PATCH` with `isArchived: false`). The web Menu tab has Reviews, Remove and Restore buttons.
- **Insights** — `GET /cafeteria/stats` (staff/admin): today's orders and revenue, average time to collect, 7-day trend, top sellers and low-stock dishes. Shown on the dashboard's Live orders tab.
- **Live updates** — see [Live data sync](#live-data-sync). Menu, stock, ratings and orders refresh on every client without a reload.
- Requires the `menu_stock_and_reviews` migration: `cd backend && npx prisma migrate deploy`.

### Sample data

`cd backend && npm run db:seed` wipes the database and loads, among everything else: about 30 dishes (INR prices, photos, nutrition, allergens, a few sold-out, low-stock and archived), 4 extra students (`student2`–`student5@smartcampus.edu`), 23 orders across the last two weeks in every status (today's are in flight so the kitchen queue has work), and reviews. `student@smartcampus.edu` has the richest order history.

## Live data sync

Every change to shared data is announced over the socket so web and mobile stay in step without a reload.

- **Server:** after a write, services call `publishChange(resource, audience, action, ids)` (`backend/src/sockets/liveSync.ts`), which emits one `data:changed` event: `{ resource, action, ids }`. It is only a hint (no record data). Resources: `menu`, `reviews`, `rooms`, `buildings`, `schedules`, `bookings`, `emergencies`, `medicines`, `medicineOrders`, `consultations`, `users`, `notifications`. Cafeteria orders keep their own `order:*` events.
- **Audience:** public data (menu, rooms, medicines…) goes to everyone signed in. Private data goes only to the owner (`user-<id>` room) and the roles allowed to read it (`role-<ROLE>` rooms), e.g. bookings → owner + admin + faculty, users → admins + that user, emergencies → reporter + medical roles.
- **Clients:** `web-dashboard/src/services/socket.ts` and `mobile-app/src/services/socket.ts` map each resource to the screens that show it, which then refetch through the normal REST endpoints (so permissions are re-checked). Both also refetch everything when the socket reconnects, and keep a slow poll only as a safety net.
- **Adding a new live resource:** call `publishChange` after the write, add the resource to `SyncResource`, map it in both `socket.ts` files, and subscribe the screen.
- Covered by `tests/live-sync.test.ts` (real socket server and clients) and `tests/unit/liveSync.test.ts`.

## Settings

Campus-wide values live in the database (`campus_settings`), not in code: security hotline, medical-centre phone and location, cafeteria opening hours, the SOS building-match radius and how many days ahead rooms can be booked. `GET /api/v1/settings` is readable by everyone signed in; `PUT /api/v1/settings` changes any subset, and each key can only be changed by the roles that own it (e.g. cafeteria staff edit the hours, admins edit all). Changes are audited and pushed live to every client. Defaults come from the environment where one exists. Edit them on the web dashboard's **Settings** page.

## Roles and sessions

An access token only says *who* someone is. Their **role and active status are re-read from the database** (cached for 15 s) on every API request and every socket handshake, so promoting, demoting or deactivating someone applies to their very next request. When an admin changes a role or deactivates an account, that user's live sockets are dropped and the clients reconnect straight into the rooms for the new role; a deactivated account is refused and signed out.

## Mobile app screens

Besides the tabs: **Notifications** (inbox with unread badge on Home, tap to open the related screen), **Room bookings** (upcoming/past, cancel), **Pharmacy & requests** (pharmacy orders with cancel while still received, nurse requests) and **Food orders** (history, reorder, rate dishes). All of them update live.

## Seed Accounts (`Password@123`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@smartcampus.edu` | `Password@123` |
| Faculty | `faculty@smartcampus.edu` | `Password@123` |
| Student | `student@smartcampus.edu` | `Password@123` |
| Cafeteria Staff | `cafeteria@smartcampus.edu` | `Password@123` |
| Medical Staff | `medical@smartcampus.edu` | `Password@123` |
| Ambulance Responder | `responder@smartcampus.edu` | `Password@123` |
