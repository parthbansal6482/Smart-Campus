import { Request } from 'express';

export interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Reads `page`/`limit` query params (1-indexed page) into safe, bounded values. */
export const getPagination = (req: Request): PaginationParams => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const requestedLimit = parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, requestedLimit));

  return { skip: (page - 1) * limit, take: limit, page, limit };
};

export const buildMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
