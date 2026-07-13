import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, withRlsContext } from '@/lib/prisma';
import { requireAccessToken } from '@/lib/auth/current-user';
import { childProfileSchema } from '@/lib/schemas/auth';
import { auditEvent } from '@/lib/audit';
import { rateLimit } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/auth/ip';

export async function GET() {
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

    const children = await db.childProfile.findMany({
      where: { familyId, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      family: { id: familyId },
      children,
    });
  });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit({ key: `child_create:${ip}`, maxRequests: 10, windowSeconds: 60 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'auth.rate_limited' }, { status: 429 });
  }

  let claims;
  let familyId;
  try {
    ({ claims, familyId } = await requireAccessToken());
  } catch {
    return NextResponse.json({ error: 'auth.unauthorized' }, { status: 401 });
  }

  if (!familyId) {
    await auditEvent({
      actorId: claims.sub,
      action: 'child_profile.created',
      targetType: 'family',
      result: 'blocked',
      reasonCode: 'no_family',
    });
    return NextResponse.json({ error: 'auth.forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const parsed = childProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_error', issues: parsed.error.issues }, { status: 400 });
  }

  return withRlsContext({ userId: claims.sub, familyId }, async () => {
    const db = getPrisma();

    const { nickname, age, avatar } = parsed.data;
    const child = await db.childProfile.create({
      data: {
        familyId,
        nickname: nickname.trim(),
        age,
        avatar: avatar ? avatar.trim() : undefined,
      },
    });

    await auditEvent({
      actorId: claims.sub,
      action: 'child_profile.created',
      targetType: 'child_profile',
      targetId: child.id,
      result: 'success',
    });

    return NextResponse.json({ child });
  });
}
