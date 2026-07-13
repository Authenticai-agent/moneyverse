import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRlsContext, getPrisma } from '@/lib/prisma';
import { requireAccessToken } from '@/lib/auth/current-user';
import { isGuardianInFamily } from '@/lib/auth/authorization';
import { createSavingsGoal, getSavingsGoalsWithProgress } from '@/lib/savings-goals';

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  targetAmountMinor: z.number().int().min(1),
  currency: z.string().max(32).optional().default('simulated_cash'),
  dueDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid due date',
  }),
});

export async function GET(_request: Request, context: { params: Promise<{  childId: string  }> }) {
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

    const goals = await getSavingsGoalsWithProgress(params.childId, db);
    return NextResponse.json({ goals });
  });
}

export async function POST(request: Request, context: { params: Promise<{  childId: string  }> }) {
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

  const parsed = createSchema.safeParse(body);
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

    const data = parsed.data;
    const goal = await createSavingsGoal(
      {
        child: { connect: { id: params.childId } },
        title: data.title,
        description: data.description,
        targetAmountMinor: data.targetAmountMinor,
        currency: data.currency,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      db
    );

    return NextResponse.json({ goal: { ...goal, currentAmountMinor: 0 } }, { status: 201 });
  });
}
