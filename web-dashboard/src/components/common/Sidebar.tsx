import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  HeartPulse,
  UtensilsCrossed,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../types';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();

  const userRole: Role = user?.role || 'ADMIN';

  const navItems = [
    {
      label: 'Campus Overview',
      path: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN'],
    },
    {
      label: 'Classroom Hub',
      path: '/classroom',
      icon: GraduationCap,
      roles: ['ADMIN', 'FACULTY'],
    },
    {
      label: 'Medical Help',
      path: '/medical-help',
      icon: HeartPulse,
      badge: 'Dispatches',
      roles: ['ADMIN', 'MEDICAL_STAFF', 'AMBULANCE_RESPONDER'],
    },
    {
      label: 'Cafeteria Orders',
      path: '/cafeteria',
      icon: UtensilsCrossed,
      roles: ['ADMIN', 'CAFETERIA_STAFF'],
    },
    {
      label: 'Users & Roles',
      path: '/users',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['ADMIN', 'CAFETERIA_STAFF', 'MEDICAL_STAFF', 'AMBULANCE_RESPONDER', 'FACULTY'],
    },
  ];

  return (
    <aside className="w-64 bg-[#fcfdfe] border-r border-slate-200/80 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-campus-600 flex items-center justify-center text-white font-bold shadow-sm shadow-campus-200">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 leading-tight">Smart Campus</h1>
          <p className="text-[11px] font-medium text-slate-400">Unified Portal</p>
        </div>
      </div>

      {/* Role Badge Indicator */}
      <div className="px-4 pt-3 pb-1">
        <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Scope</span>
          <span className="text-[11px] font-bold text-campus-700 uppercase bg-campus-50 px-2 py-0.5 rounded border border-campus-200/60">
            {userRole.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          if (!item.roles.includes(userRole)) return null;

          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-campus-50 text-campus-700 font-semibold shadow-xs border border-campus-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-campus-100 text-campus-700 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'Staff User'}</p>
              <p className="text-[11px] text-slate-400 truncate capitalize">{userRole.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
