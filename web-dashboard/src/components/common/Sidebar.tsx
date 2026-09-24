import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, DoorOpen, HeartPulse, UtensilsCrossed, Users, Settings, LogOut, LucideIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../types';
import { cn } from '../../lib/utils';
import { roleLabel } from '../../lib/status';
import { Avatar } from '../ui/Feedback';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
}

const sections: { title?: string; items: NavItem[] }[] = [
  {
    items: [{ label: 'Overview', path: '/', icon: LayoutGrid, roles: ['ADMIN'] }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Classrooms', path: '/classroom', icon: DoorOpen, roles: ['ADMIN', 'FACULTY'] },
      {
        label: 'Medical help',
        path: '/medical-help',
        icon: HeartPulse,
        roles: ['ADMIN', 'MEDICAL_STAFF', 'AMBULANCE_RESPONDER'],
      },
      { label: 'Cafeteria', path: '/cafeteria', icon: UtensilsCrossed, roles: ['ADMIN', 'CAFETERIA_STAFF'] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'People', path: '/users', icon: Users, roles: ['ADMIN'] },
      {
        label: 'Settings',
        path: '/settings',
        icon: Settings,
        roles: ['ADMIN', 'CAFETERIA_STAFF', 'MEDICAL_STAFF', 'AMBULANCE_RESPONDER', 'FACULTY'],
      },
    ],
  },
];

export const Brand: React.FC = () => (
  <div className="flex items-center gap-2.5">
    <span className="w-8 h-8 rounded-lg bg-ink text-canvas flex items-center justify-center font-serif text-lg leading-none">
      S
    </span>
    <div className="leading-tight">
      <p className="text-sm font-semibold text-ink">Smart Campus</p>
      <p className="text-xs text-ink-3">Operations</p>
    </div>
  </div>
);

export const Sidebar: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const { user, logout } = useAuthStore();
  const role = user?.role;

  return (
    <aside className="flex flex-col h-full w-64 px-3 py-5">
      <div className="px-2.5 mb-8">
        <Brand />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        {sections.map((section, i) => {
          const visible = section.items.filter(item => role && item.roles.includes(role));
          if (visible.length === 0) return null;
          return (
            <div key={section.title ?? i}>
              {section.title && <p className="px-2.5 mb-1.5 text-xs text-ink-4">{section.title}</p>}
              <ul className="space-y-0.5">
                {visible.map(item => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/'}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 h-9 px-2.5 rounded-lg text-sm transition-colors border',
                            isActive
                              ? 'bg-surface text-ink font-medium border-line'
                              : 'text-ink-2 border-transparent hover:text-ink hover:bg-sunken'
                          )
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                        {item.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="mt-4 pt-4 border-t border-line flex items-center gap-3 px-1.5">
        <Avatar name={user?.name} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-ink truncate">{user?.name}</p>
          <p className="text-xs text-ink-3 truncate">{role ? roleLabel[role] : ''}</p>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
          className="p-2 rounded-lg text-ink-3 hover:text-ink hover:bg-sunken transition-colors"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
};
