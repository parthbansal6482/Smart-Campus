import React, { useState, useEffect } from 'react';
import { Bell, Search, Activity, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface NavbarProps {
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title = 'Dashboard Overview' }) => {
  const { user } = useAuthStore();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <span>Portal</span>
            <span>/</span>
            <span className="text-slate-600 font-semibold">{title}</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        {/* Real-time System Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-600 font-medium text-[11px]">System Online</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono text-[11px] tabular-nums">{timeStr}</span>
        </div>

        {/* Global Search */}
        <div className="relative w-56 hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search (Ctrl+K)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Notification Bell */}
        <button
          title="System notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </button>

        {/* Role Badge in Navbar */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'Staff'}</span>
            <span className="text-[10px] text-blue-600 font-medium uppercase tracking-wide">
              {user?.role?.replace('_', ' ') || 'ADMIN'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {user?.name?.charAt(0) || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
};
