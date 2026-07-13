import { Prisma, VirtualLedgerEntry } from '@prisma/client';
import { getPrisma } from '@/lib/prisma';
import { auditEvent, AuditAction } from '@/lib/audit';

export async function getBalance(
  childId: string,
  currency: string,
  db: Prisma.TransactionClient = getPrisma()
): Promise<number> {
  const result = await db.virtualLedgerEntry.aggregate({
    where: { childId, currency },
    _sum: { amountMinor: true },
  });
  return result._sum.amountMinor ?? 0;
}

export async function getEntries(
  childId: string,
  currency: string,
  db: Prisma.TransactionClient = getPrisma()
): Promise<VirtualLedgerEntry[]> {
  return db.virtualLedgerEntry.findMany({
    where: { childId, currency },
    orderBy: { createdAt: 'desc' },
  });
}

export type CreateEntryResult = 'created' | 'blocked';

export async function createEntry(args: {
  childId: string;
  currency: string;
  amountMinor: number;
  entryType?: 'credit' | 'debit';
  sourceType: string;
  sourceId?: string;
  idempotencyKey: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
  allowNegative?: boolean;
  auditAction?: AuditAction;
}): Promise<CreateEntryResult> {
  const db = getPrisma();
  const amount = args.entryType === 'debit' ? -Math.abs(args.amountMinor) : Math.abs(args.amountMinor);

  if (amount < 0 && !args.allowNegative) {
    const balance = await getBalance(args.childId, args.currency, db);
    if (balance + amount < 0) {
      throw new Error('ledger.insufficient_funds');
    }
  }

  let account = await db.simulatedAccount.findUnique({
    where: { childId_currency: { childId: args.childId, currency: args.currency } },
  });

  if (!account) {
    account = await db.simulatedAccount.create({
      data: { childId: args.childId, currency: args.currency },
    });
  }

  const existing = await db.virtualLedgerEntry.findUnique({
    where: { idempotencyKey: args.idempotencyKey },
  });

  if (existing) {
    await auditEvent({
      actorId: args.actorId,
      action: args.auditAction ?? 'ledger.entry.created',
      targetType: 'child_profile',
      targetId: args.childId,
      result: 'blocked',
      reasonCode: 'idempotency.duplicate',
      metadata: args.metadata,
    });
    return 'blocked';
  }

  await db.virtualLedgerEntry.create({
    data: {
      childId: args.childId,
      simulatedAccountId: account.id,
      amountMinor: amount,
      currency: args.currency,
      entryType: args.entryType ?? 'credit',
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      idempotencyKey: args.idempotencyKey,
      metadata: args.metadata as Prisma.InputJsonValue,
    },
  });

  await auditEvent({
    actorId: args.actorId,
    action: args.auditAction ?? 'ledger.entry.created',
    targetType: 'child_profile',
    targetId: args.childId,
    result: 'success',
    metadata: args.metadata,
  });

  return 'created';
}
