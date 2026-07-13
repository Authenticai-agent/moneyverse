import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRlsContext, getPrisma } from '@/lib/prisma';
import { requireAccessToken } from '@/lib/auth/current-user';
import { isGuardianInFamily } from '@/lib/auth/authorization';
import { getSavingsGoal, getSavingsGoalProgress, updateSavingsGoal } from '@/lib/savings-goals';

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  targetAmountMinor: z.number().int().min(1).optional(),
  dueDate: z.string().optional().nullable().refine((val) => val === null || val === undefined || !isNaN(Date.parse(val)), {
    message: 'Invalid due date',
  }),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
});

export async function GET(_request: Request, context: { params: Promise<{  childId: string; goalId: string  }> }) {
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

    const currentAmountMinor = await getSavingsGoalProgress(params.goalId, db);
    return NextResponse.json({ goal: { ...goal, currentAmountMinor } });
  });
}

export async function PATCH(request: Request, context: { params: Promise<{  childId: string; goalId: string  }> }) {
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

  const parsed = updateSchema.safeParse(body);
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

    const existing = await getSavingsGoal(params.goalId, db);
    if (!existing || existing.childId !== params.childId) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const data = parsed.data;
    const updateData: Parameters<typeof updateSavingsGoal>[1] = {
      title: data.title,
      description: data.description,
      targetAmountMinor: data.targetAmountMinor,
      status: data.status,
      dueDate: data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null,
    };

    const goal = await updateSavingsGoal(params.goalId, updateData, db);
    const currentAmountMinor = await getSavingsGoalProgress(params.goalId, db);
    return NextResponse.json({ goal: { ...goal, currentAmountMinor } });
  });
}
