# Smart Campus — Mobile App (Students & Faculty)

Engaging, student-friendly mobile companion built with React Native (Expo), TypeScript, and React Navigation.

## Features

- **Bottom Tab Navigation**: 4 Core Tabs — Home (Campus Feed), Classrooms, Cafeteria, Profile.
- **One-Tap SOS Emergency Assistance**: Floating emergency action button (FAB) visible across tabs with geolocation capture and nearest campus building identification.
- **Classroom Discovery & Booking**: Find vacant rooms, inspect HVAC/projector facilities, reserve instantly.
- **Smart Cafeteria Ordering**: Browse category catalog, customize quantities, choose Pickup or Dine-In, and track kitchen status.
- **Auth & Profile Management**: Unified login and signup connected to backend API.

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Start Expo Development Server
npm start

# Run on Android emulator / iOS simulator:
npm run android
npm run ios
```

## Demo Credentials

- **Student:** `student@smartcampus.edu` / `Password@123`
- **Faculty:** `faculty@smartcampus.edu` / `Password@123`
## Emergency location tracking

An active SOS uses Expo background location updates so responders continue receiving the reporter’s latest position when the app is backgrounded. The incident id is persisted locally and restored when the app starts again. Users who decline background permission still receive foreground tracking while the app is open.

For a native build, the `expo-location` config plugin enables the iOS background location mode and Android background/foreground-service permissions. Expo Go may fall back to foreground tracking because native background task configuration is build-time dependent.
