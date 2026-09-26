import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authService } from '../services/auth.service';
import { tokenStorage, setUnauthorizedHandler, USER_STORAGE_KEY } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  loadSession: async () => {
    try {
      const [token, userStr] = await Promise.all([
        tokenStorage.getAccessToken(),
        AsyncStorage.getItem(USER_STORAGE_KEY),
      ]);
      if (token && userStr) {
        set({ user: JSON.parse(userStr), isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user, accessToken, refreshToken } = await authService.login(email, password);
      await tokenStorage.setTokens(accessToken, refreshToken);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async data => {
    set({ isLoading: true });
    try {
      const { user, accessToken, refreshToken } = await authService.register(data);
      await tokenStorage.setTokens(accessToken, refreshToken);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    await tokenStorage.clear();
    set({ user: null, isAuthenticated: false });
    await authService.logout(refreshToken);
  },
}));

// Wired up here (rather than inside api.ts) to avoid a circular import
// between the two modules — api.ts only knows "something can handle this",
// not about the store itself.
setUnauthorizedHandler(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
