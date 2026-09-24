import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sidebar, Brand } from '../components/common/Sidebar';

export const DashboardLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen shrink-0 border-r border-line">
        <Sidebar />
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 h-14 px-4 flex items-center justify-between bg-canvas/95 backdrop-blur border-b border-line">
        <Brand />
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          className="p-2 -mr-2 rounded-lg text-ink-2 hover:bg-sunken"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 bg-canvas border-r border-line animate-enter">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-5 p-2 rounded-lg text-ink-3 hover:bg-sunken"
            >
              <X className="w-4 h-4" />
            </button>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-8 md:py-12 animate-enter" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
