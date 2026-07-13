import { getBalance, createEntry } from '@/lib/ledger';

const XP_CURRENCY = 'learning_xp';

function accountIdempotencyKey(childId: string, lessonVersionId: string, action: string): string {
  return `xp:${childId}:${lessonVersionId}:${action}`;
}

export async function getXpBalance(childId: string): Promise<number> {
  return getBalance(childId, XP_CURRENCY);
}

export async function awardLessonXp(
  childId: string,
  lessonVersionId: string,
  actorId?: string,
  amount: number = 50
): Promise<void> {
  if (amount < 0) {
    throw new Error('xp.amount.positive');
  }

  const idempotencyKey = accountIdempotencyKey(childId, lessonVersionId, 'completion');

  await createEntry({
    childId,
    currency: XP_CURRENCY,
    amountMinor: amount,
    entryType: 'credit',
    sourceType: 'lesson',
    sourceId: lessonVersionId,
    idempotencyKey,
    actorId,
    auditAction: 'xp.awarded',
    metadata: { amount, currency: XP_CURRENCY, lessonVersionId },
  });
}
