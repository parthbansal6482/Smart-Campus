import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authService } from '../services/auth.service';
import { tokenStorage, setUnauthorizedHandler, USER_STORAGE_KEY } from '../services/api';
import { registerForPushNotifications, unregisterPushNotifications } from '../services/pushNotifications';
import { connectSocket, disconnectSocket } from '../services/socket';
import { realtimeEvents, REALTIME_EVENTS } from '../services/realtimeEvents';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  /** Re-reads the signed-in user's profile; a failure never signs them out. */
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  refreshUser: async () => {
    try {
      const user = await authService.getMe();
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      set({ user });
    } catch {
      /* keep the profile we have; the next change or reconnect retries */
    }
  },

  updateProfile: async data => {
    const user = await authService.updateProfile(data);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    set({ user });
  },

  loadSession: async () => {
    try {
      const [token, userStr] = await Promise.all([
        tokenStorage.getAccessToken(),
        AsyncStorage.getItem(USER_STORAGE_KEY),
      ]);
      if (token && userStr) {
        set({ user: JSON.parse(userStr), isAuthenticated: true, isLoading: false });
        registerForPushNotifications();
        connectSocket();
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
      registerForPushNotifications();
      connectSocket();
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
      registerForPushNotifications();
      connectSocket();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    await unregisterPushNotifications();
    disconnectSocket();
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

// An admin changing this account's name, role or status (or another device editing the profile)
// shows up here without signing out and back in.
realtimeEvents.on(REALTIME_EVENTS.usersChanged, (ids?: string[]) => {
  const me = useAuthStore.getState().user;
  if (me && (!ids?.length || ids.includes(me.id))) void useAuthStore.getState().refreshUser();
});

// The server refuses the realtime handshake for a deactivated account: sign out rather than leave a dead session.
realtimeEvents.on('account-deactivated', () => {
  if (useAuthStore.getState().isAuthenticated) void useAuthStore.getState().logout();
});
