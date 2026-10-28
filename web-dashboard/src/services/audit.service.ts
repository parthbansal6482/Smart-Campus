import { api } from './api';
import { ApiResponse, AuditLog } from '../types';

export interface AuditQuery {
  page: number;
  limit: number;
  action?: string;
  targetType?: string;
  from?: string;
  to?: string;
}

interface AuditMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const auditService = {
  list: async (params: AuditQuery): Promise<{ entries: AuditLog[]; meta: AuditMeta }> => {
    const res = await api.get<ApiResponse<AuditLog[]> & { meta: AuditMeta }>('/audit-logs', { params });
    return { entries: res.data.data, meta: res.data.meta };
  },
};
