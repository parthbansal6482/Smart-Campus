import { create } from 'zustand';
import { User, Role } from '../types';
import { authService } from '../services/auth.service';
import { tokenStorage, setUnauthorizedHandler, USER_STORAGE_KEY } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
}

const readStoredUser = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: readStoredUser(),
  isAuthenticated: !!tokenStorage.getAccessToken(),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user, accessToken, refreshToken } = await authService.login(email, password);
      tokenStorage.setTokens(accessToken, refreshToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    tokenStorage.clear();
    set({ user: null, isAuthenticated: false });
    await authService.logout(refreshToken);
  },

  checkAuth: async () => {
    if (!tokenStorage.getAccessToken()) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    try {
      const user = await authService.getMe();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      tokenStorage.clear();
      set({ user: null, isAuthenticated: false });
    }
  },

  hasRole: (roles: Role[]) => {
    const { user } = get();
    if (!user) return false;
    return roles.includes(user.role);
  },
}));

// Wired up here (rather than inside api.ts) to avoid a circular import
// between the two modules — api.ts only knows "something can handle this",
// not about the store itself.
setUnauthorizedHandler(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
