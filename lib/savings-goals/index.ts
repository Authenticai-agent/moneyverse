import { randomUUID } from 'crypto';
import { Prisma, SavingsGoal } from '@prisma/client';
import { getPrisma } from '@/lib/prisma';
import { auditEvent } from '@/lib/audit';
import { createEntry } from '@/lib/ledger';

export async function createSavingsGoal(
  data: Prisma.SavingsGoalCreateInput,
  db: Prisma.TransactionClient = getPrisma()
): Promise<SavingsGoal> {
  const goal = await db.savingsGoal.create({ data });
  await auditEvent({
    actorId: undefined,
    action: 'savings.goal.created',
    targetType: 'savings_goal',
    targetId: goal.id,
    result: 'success',
    metadata: { childId: goal.childId, targetAmountMinor: goal.targetAmountMinor, currency: goal.currency },
  });
  return goal;
}

export async function getSavingsGoals(
  childId: string,
  db: Prisma.TransactionClient = getPrisma()
): Promise<SavingsGoal[]> {
  return db.savingsGoal.findMany({
    where: { childId },
    orderBy: { createdAt: 'desc' },
  });
}

export type SavingsGoalWithProgress = SavingsGoal & { currentAmountMinor: number };

export async function getSavingsGoalsWithProgress(
  childId: string,
  db: Prisma.TransactionClient = getPrisma()
): Promise<SavingsGoalWithProgress[]> {
  const goals = await db.savingsGoal.findMany({
    where: { childId },
    orderBy: { createdAt: 'desc' },
  });

  const progressBySourceId = new Map<string, number>();
  if (goals.length > 0) {
    const aggregates = await db.virtualLedgerEntry.groupBy({
      by: ['sourceId'],
      where: {
        childId,
        sourceType: 'savings_goal',
        sourceId: { in: goals.map((g) => g.id) },
      },
      _sum: { amountMinor: true },
    });
    for (const agg of aggregates) {
      if (agg.sourceId) {
        progressBySourceId.set(agg.sourceId, Math.abs(agg._sum.amountMinor ?? 0));
      }
    }
  }

  return goals.map((goal) => ({
    ...goal,
    currentAmountMinor: progressBySourceId.get(goal.id) ?? 0,
  }));
}

export async function getSavingsGoal(
  goalId: string,
  db: Prisma.TransactionClient = getPrisma()
): Promise<SavingsGoal | null> {
  return db.savingsGoal.findUnique({
    where: { id: goalId },
  });
}

export async function updateSavingsGoal(
  goalId: string,
  data: Prisma.SavingsGoalUpdateInput,
  db: Prisma.TransactionClient = getPrisma()
): Promise<SavingsGoal> {
  const goal = await db.savingsGoal.update({
    where: { id: goalId },
    data,
  });
  await auditEvent({
    actorId: undefined,
    action: 'savings.goal.updated',
    targetType: 'savings_goal',
    targetId: goal.id,
    result: 'success',
    metadata: { childId: goal.childId },
  });
  return goal;
}

export async function getSavingsGoalProgress(
  goalId: string,
  db: Prisma.TransactionClient = getPrisma()
): Promise<number> {
  const goal = await db.savingsGoal.findUnique({
    where: { id: goalId },
    select: { childId: true },
  });
  if (!goal) return 0;

  const result = await db.virtualLedgerEntry.aggregate({
    where: {
      childId: goal.childId,
      sourceType: 'savings_goal',
      sourceId: goalId,
    },
    _sum: { amountMinor: true },
  });

  return Math.abs(result._sum.amountMinor ?? 0);
}

export type AllocateResult = 'created' | 'blocked' | 'insufficient_funds';

export async function allocateToSavingsGoal(
  goalId: string,
  amountMinor: number,
  actorId: string,
  db: Prisma.TransactionClient = getPrisma()
): Promise<AllocateResult> {
  const goal = await db.savingsGoal.findUnique({
    where: { id: goalId },
  });
  if (!goal) throw new Error('savings_goal.not_found');
  if (goal.status !== 'active') throw new Error('savings_goal.not_active');

  if (amountMinor <= 0) throw new Error('savings_goal.invalid_amount');

  try {
    const result = await createEntry({
      childId: goal.childId,
      currency: goal.currency,
      amountMinor,
      entryType: 'debit',
      sourceType: 'savings_goal',
      sourceId: goal.id,
      idempotencyKey: `savings_goal:${goal.id}:allocate:${randomUUID()}`,
      actorId,
      auditAction: 'savings.goal.allocated',
      metadata: { goalId: goal.id },
    });
    return result;
  } catch (error) {
    if (error instanceof Error && error.message === 'ledger.insufficient_funds') {
      return 'insufficient_funds';
    }
    throw error;
  }
}
