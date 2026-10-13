import { create } from 'zustand';
import { User, Role } from '../types';
import { authService } from '../services/auth.service';
import { tokenStorage, setUnauthorizedHandler, USER_STORAGE_KEY } from '../services/api';
import { connectSocket, disconnectSocket, REALTIME_EVENTS } from '../services/socket';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  /** Re-reads the signed-in user's profile; unlike checkAuth, a failure never signs them out. */
  refreshUser: () => Promise<void>;
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
      connectSocket();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    disconnectSocket();
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
      connectSocket();
    } catch {
      tokenStorage.clear();
      set({ user: null, isAuthenticated: false });
    }
  },

  refreshUser: async () => {
    try {
      const user = await authService.getMe();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      set({ user });
    } catch {
      /* keep the profile we have; the next change or reconnect retries */
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

// An admin changing this account's name, role or status (or another device editing the profile)
// shows up here without signing out and back in.
window.addEventListener(REALTIME_EVENTS.usersChanged, event => {
  const ids: string[] | undefined = (event as CustomEvent).detail?.ids;
  const me = useAuthStore.getState().user;
  if (me && (!ids?.length || ids.includes(me.id))) void useAuthStore.getState().refreshUser();
});

window.addEventListener('realtime:account-deactivated', () => {
  if (useAuthStore.getState().isAuthenticated) void useAuthStore.getState().logout();
});
