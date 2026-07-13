import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRlsContext, getPrisma } from '@/lib/prisma';
import { requireAccessToken } from '@/lib/auth/current-user';
import { isGuardianInFamily } from '@/lib/auth/authorization';
import { getSavingsGoal, getSavingsGoalProgress, allocateToSavingsGoal } from '@/lib/savings-goals';

const allocateSchema = z.object({
  amountMinor: z.number().int().min(1),
});

export async function POST(request: Request, context: { params: Promise<{  childId: string; goalId: string  }> }) {
  const params = await context.params;
  let claims;
  let familyId;
  try {
    ({ claims, familyId } = await requireAccessToken());
  } catch {
    return NextResponse.json({ error: 'auth.unauthorized' }, { status: 401 });
  }

  if (!familyId) {
    return NextResponse.json({ error: 'no_family' }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const parsed = allocateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', details: parsed.error.format() }, { status: 400 });
  }

  return withRlsContext({ userId: claims.sub, familyId }, async () => {
    const db = getPrisma();

    const authorized = await isGuardianInFamily(claims.sub, familyId);
    if (!authorized) {
      return NextResponse.json({ error: 'auth.forbidden' }, { status: 403 });
    }

    const child = await db.childProfile.findFirst({
      where: { id: params.childId, familyId, status: 'active' },
    });
    if (!child) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const goal = await getSavingsGoal(params.goalId, db);
    if (!goal || goal.childId !== params.childId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const result = await allocateToSavingsGoal(params.goalId, parsed.data.amountMinor, claims.sub, db);

    if (result === 'insufficient_funds') {
      return NextResponse.json({ error: 'savings_goal.insufficient_funds' }, { status: 400 });
    }

    if (result === 'blocked') {
      return NextResponse.json({ error: 'savings_goal.duplicate' }, { status: 409 });
    }

    const updatedGoal = await getSavingsGoal(params.goalId, db);
    const currentAmountMinor = await getSavingsGoalProgress(params.goalId, db);
    return NextResponse.json({ goal: { ...updatedGoal, currentAmountMinor } });
  });
}
