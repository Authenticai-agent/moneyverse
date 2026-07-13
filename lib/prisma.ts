import { AsyncLocalStorage } from 'async_hooks';
import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export type RlsContext = {
  userId?: string;
  familyId?: string;
  bypass?: boolean;
};

type RlsStore = {
  tx: Prisma.TransactionClient;
  context: RlsContext;
};

const rlsStore = new AsyncLocalStorage<RlsStore>();

export function getPrisma(): PrismaClient {
  return (rlsStore.getStore()?.tx ?? prisma) as PrismaClient;
}

export function getRlsContext(): RlsContext | undefined {
  return rlsStore.getStore()?.context;
}

async function applyContext(tx: Prisma.TransactionClient, context: RlsContext): Promise<void> {
  if (context.bypass) {
    await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'true', true)`;
    await tx.$executeRaw`SELECT set_config('app.user_id', '', true)`;
    await tx.$executeRaw`SELECT set_config('app.family_id', '', true)`;
  } else {
    await tx.$executeRaw`SELECT set_config('app.bypass_rls', '', true)`;
    if (context.userId) {
      await tx.$executeRaw`SELECT set_config('app.user_id', ${context.userId}, true)`;
    } else {
      await tx.$executeRaw`SELECT set_config('app.user_id', '', true)`;
    }
    if (context.familyId) {
      await tx.$executeRaw`SELECT set_config('app.family_id', ${context.familyId}, true)`;
    } else {
      await tx.$executeRaw`SELECT set_config('app.family_id', '', true)`;
    }
  }
}

export async function withRlsContext<T>(
  context: RlsContext,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const existing = rlsStore.getStore();
  if (existing) {
    await applyContext(existing.tx, context);
    existing.context = context;
    return callback(existing.tx);
  }

  return prisma.$transaction(async (tx) => {
    await applyContext(tx, context);
    return rlsStore.run({ tx, context }, async () => callback(tx));
  });
}

export async function withSystemContext<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return withRlsContext({ bypass: true }, callback);
}
