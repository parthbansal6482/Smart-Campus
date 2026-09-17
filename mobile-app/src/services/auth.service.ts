import { api } from './api';
import { User } from '../types';

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', {
      email,
      password,
    });
    return res.data.data;
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', data);
    return res.data.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<{ success: boolean; data: User }>('/auth/me');
    return res.data.data;
  },
};
