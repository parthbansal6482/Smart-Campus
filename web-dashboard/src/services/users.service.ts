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
};
