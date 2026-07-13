import { NextResponse } from 'next/server';
import { getPrisma, withRlsContext } from '@/lib/prisma';
import { requireAccessToken } from '@/lib/auth/current-user';
import { isGuardianInFamily } from '@/lib/auth/authorization';
import { auditEvent } from '@/lib/audit';
import { getXpBalance } from '@/lib/rewards/xp';

export async function GET(request: Request, context: { params: Promise<{  childId: string  }> }) {
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
      await auditEvent({
        actorId: claims.sub,
        action: 'child_profile.viewed',
        targetType: 'child_profile',
        targetId: params.childId,
        result: 'blocked',
        reasonCode: 'no_family',
      });
      return NextResponse.json({ error: 'auth.forbidden' }, { status: 403 });
    }

    const child = await db.childProfile.findFirst({
      where: { id: params.childId, familyId, status: 'active' },
    });

    if (!child) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    await auditEvent({
      actorId: claims.sub,
      action: 'child_profile.viewed',
      targetType: 'child_profile',
      targetId: child.id,
      result: 'success',
    });

    const xp = await getXpBalance(child.id);

    return NextResponse.json({ child: { ...child, xp } });
  });
}

export async function DELETE(request: Request, context: { params: Promise<{  childId: string  }> }) {
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
      await auditEvent({
        actorId: claims.sub,
        action: 'child_profile.deleted',
        targetType: 'child_profile',
        targetId: params.childId,
        result: 'blocked',
        reasonCode: 'no_family',
      });
      return NextResponse.json({ error: 'auth.forbidden' }, { status: 403 });
    }

    const { count } = await db.childProfile.deleteMany({
      where: { id: params.childId, familyId },
    });

    if (count === 0) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    await auditEvent({
      actorId: claims.sub,
      action: 'child_profile.deleted',
      targetType: 'child_profile',
      targetId: params.childId,
      result: 'success',
    });

    return new NextResponse(null, { status: 204 });
  });
}
