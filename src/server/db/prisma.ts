import { PrismaClient } from '@/server/db/generated/prisma';

// Next.js dev-mode HMR re-evaluates modules on every edit; without stashing the
// client on globalThis each reload would open a new connection pool until
// Postgres refuses further connections.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
