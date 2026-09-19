import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Role } from '../types';

export const getDefaultRouteForRole = (role?: Role): string => {
  switch (role) {
    case 'CAFETERIA_STAFF':
      return '/cafeteria';
    case 'MEDICAL_STAFF':
    case 'AMBULANCE_RESPONDER':
      return '/medical-help';
    case 'FACULTY':
      return '/classroom';
    case 'ADMIN':
    default:
      return '/';
  }
};

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const defaultRoute = getDefaultRouteForRole(user.role);
    return <Navigate to={defaultRoute} replace />;
  }

  return <Outlet />;
};
