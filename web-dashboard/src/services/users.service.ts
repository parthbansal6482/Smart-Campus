import { api } from './api';
import { ApiResponse, Role, User } from '../types';

export const usersService = {
  getAll: async (role?: Role): Promise<User[]> => {
    const res = await api.get<ApiResponse<User[]>>('/users', { params: { role } });
    return res.data.data;
  },

  updateRole: async (id: string, role: Role): Promise<User> => {
    const res = await api.patch<ApiResponse<User>>(`/users/${id}/role`, { role });
    return res.data.data;
  },

  updateActive: async (id: string, isActive: boolean): Promise<User> => {
    const res = await api.patch<ApiResponse<User>>(`/users/${id}/active`, { isActive });
    return res.data.data;
  },

  create: async (data: { name: string; email: string; password: string; role: Role; phone?: string }): Promise<User> => {
    const res = await api.post<ApiResponse<User>>('/users', data);
    return res.data.data;
  },
};
