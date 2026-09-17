import { create } from 'zustand';
import { User, Role } from '../types';
import { authService } from '../services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('smart_campus_user') || 'null'),
  token: localStorage.getItem('smart_campus_token'),
  isAuthenticated: !!localStorage.getItem('smart_campus_token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user, token } = await authService.login(email, password);
      localStorage.setItem('smart_campus_token', token);
      localStorage.setItem('smart_campus_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('smart_campus_token');
    localStorage.removeItem('smart_campus_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('smart_campus_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }
    try {
      const user = await authService.getMe();
      localStorage.setItem('smart_campus_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('smart_campus_token');
      localStorage.removeItem('smart_campus_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  hasRole: (roles: Role[]) => {
    const { user } = get();
    if (!user) return false;
    return roles.includes(user.role);
  },
}));
