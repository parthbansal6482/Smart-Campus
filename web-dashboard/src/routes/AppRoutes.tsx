import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ClassroomsPage } from '../pages/ClassroomsPage';
import { MedicalPage } from '../pages/MedicalPage';
import { CafeteriaPage } from '../pages/CafeteriaPage';
import { UsersPage } from '../pages/UsersPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Admin Cross-Module Overview */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>

          {/* Classroom Module */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'FACULTY']} />}>
            <Route path="/classroom" element={<ClassroomsPage />} />
            <Route path="/classrooms" element={<ClassroomsPage />} />
          </Route>

          {/* Medical Help Module */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'MEDICAL_STAFF', 'AMBULANCE_RESPONDER']} />}>
            <Route path="/medical-help" element={<MedicalPage />} />
            <Route path="/emergencies" element={<MedicalPage />} />
          </Route>

          {/* Cafeteria Module */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'CAFETERIA_STAFF']} />}>
            <Route path="/cafeteria" element={<CafeteriaPage />} />
          </Route>

          {/* Shared Settings */}
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* 404 & Fallback */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};
