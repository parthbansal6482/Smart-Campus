import { api } from './api';
import { ApiResponse, User } from '../types';

export interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
    return res.data.data;
  },

  register: async (data: { name: string; email: string; password: string; role?: string; phone?: string }): Promise<LoginResponse> => {
    const res = await api.post<ApiResponse<LoginResponse>>('/auth/register', data);
    return res.data.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
};
