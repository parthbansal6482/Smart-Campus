import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ||
  new PrismaClient({
    // Prisma's 5s default is easy to exceed when the database is remote
    // (e.g. hosted Supabase), which aborts orders mid-transaction.
    transactionOptions: { maxWait: 10_000, timeout: 20_000 },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
