import { Role } from '@prisma/client';
import { prisma } from '../config/db';

export interface AccountState {
  role: Role;
  isActive: boolean;
}

// A signed token only proves who someone was when it was issued. The role and active flag are
// re-read from the database (cached briefly) so a role change or deactivation applies to the
// very next request instead of when the token expires. The cache is per process: invalidating
// it on writes makes the change immediate here, and the TTL bounds staleness on other instances.
const TTL_MS = 15_000;
const cache = new Map<string, AccountState & { at: number }>();

export const getAccountState = async (userId: string): Promise<AccountState | null> => {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < TTL_MS) return { role: hit.role, isActive: hit.isActive };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, isActive: true } });
  if (!user) {
    cache.delete(userId);
    return null;
  }
  cache.set(userId, { ...user, at: Date.now() });
  return user;
};

export const invalidateAccountState = (userId: string) => {
  cache.delete(userId);
};
