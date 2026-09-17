# Smart Campus — Web Dashboard (Admin & Staff)

Modern analytics dashboard for Smart Campus Administrators, Faculty, and Cafeteria Staff built with React, Vite, Tailwind CSS, and Zustand.

## Features

- **Analytics Dashboard UI**: Minimalist, high-density dashboard inspired by Linear/Stripe.
- **Real-time Emergency Dispatch**: Incident tracking, nearest building mapping, responder status updates.
- **Classroom Automation Hub**: Live vacancy indicator, smart HVAC/projector controls, reservation logs.
- **Smart Cafeteria Kitchen Board**: Interactive order progression (`PENDING` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`) & menu management.
- **Role-Based Routing**: Protected admin and staff routes with JWT auth state.

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

The web dashboard runs at `http://localhost:5173`.

## Demo Accounts

- **Administrator**: `admin@smartcampus.edu` / `Password@123`
- **Cafeteria Staff**: `staff@smartcampus.edu` / `Password@123`
- **Medical Responder**: `responder@smartcampus.edu` / `Password@123`
