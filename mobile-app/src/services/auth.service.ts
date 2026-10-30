import { api } from './api';
import { User } from '../types';

export interface AuthTokens {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthTokens> => {
    const res = await api.post<{ success: boolean; data: AuthTokens }>('/auth/login', {
      email,
      password,
    });
    return res.data.data;
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthTokens> => {
    // The backend ignores any `role` field here — self-signup can only ever create a STUDENT account.
    const res = await api.post<{ success: boolean; data: AuthTokens }>('/auth/register', data);
    return res.data.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<{ success: boolean; data: User }>('/auth/me');
    return res.data.data;
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  getSessions: async (): Promise<AuthSession[]> => {
    const res = await api.get<{ success: boolean; data: AuthSession[] }>('/auth/sessions');
    return res.data.data;
  },

  revokeSession: async (id: string): Promise<void> => {
    await api.delete(`/auth/sessions/${id}`);
  },

  logoutAll: async (): Promise<void> => {
    await api.post('/auth/logout-all');
  },

  updateProfile: async (data: { name?: string; phone?: string }): Promise<User> => {
    const res = await api.patch<{ success: boolean; data: User }>('/users/me', data);
    return res.data.data;
  },

  /** Best-effort — revokes the refresh token server-side so it can't be replayed after sign-out. */
  logout: async (refreshToken: string | null): Promise<void> => {
    if (!refreshToken) return;
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Sign-out proceeds locally regardless of whether the server call succeeded.
    }
  },
};
