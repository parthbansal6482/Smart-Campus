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
  ShieldAlert,
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
      badge: 'Live',
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
    <aside className="w-64 bg-slate-900 border-r border-slate-800/90 flex flex-col shrink-0 h-screen sticky top-0 text-slate-300">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">Smart Campus</h1>
            <p className="text-[11px] font-medium text-slate-400">Operations Command</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-medium text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Live
        </div>
      </div>

      {/* Role Indicator Card */}
      <div className="px-4 pt-3.5 pb-2">
        <div className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Access Scope</span>
          <span className="text-[11px] font-bold text-blue-300 uppercase bg-blue-950/70 px-2 py-0.5 rounded border border-blue-500/30">
            {userRole.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          if (!item.roles.includes(userRole)) return null;

          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-105" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-100 truncate">{user?.name || 'Staff User'}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{userRole.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
