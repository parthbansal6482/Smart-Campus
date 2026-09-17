import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Campus Command Center';
      case '/classrooms':
        return 'Classroom & Facility Management';
      case '/emergencies':
        return 'Emergency Health & Incident Response';
      case '/cafeteria':
        return 'Cafeteria Orders & Menu Management';
      case '/users':
        return 'User & Role Management';
      case '/settings':
        return 'System & Campus Settings';
      default:
        return 'Smart Campus Portal';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={getPageTitle(location.pathname)} />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
