import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-3 border border-blue-500/30">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Smart Campus Command</h2>
        <p className="mt-1 text-xs text-slate-400">
          Authorized staff, faculty, and emergency responder operations portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-6 border border-slate-800 rounded-2xl shadow-xl sm:px-9 text-slate-200">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
