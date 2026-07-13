import { NextResponse } from 'next/server';
import { getPrisma, withRlsContext } from '@/lib/prisma';
import { requireAccessToken } from '@/lib/auth/current-user';
import { isGuardianInFamily } from '@/lib/auth/authorization';
import { auditEvent } from '@/lib/audit';

export async function GET(request: Request, context: { params: Promise<{  familyId: string; childId: string  }> }) {
  const params = await context.params;
  let claims;
  let membershipFamilyId;
  try {
    ({ claims, familyId: membershipFamilyId } = await requireAccessToken());
  } catch {
    return NextResponse.json({ error: 'auth.unauthorized' }, { status: 401 });
  }

  const familyId = params.familyId;
  if (!familyId) {
    return NextResponse.json({ error: 'invalid_family' }, { status: 400 });
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
        reasonCode: 'unauthorized',
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

    return NextResponse.json({ child });
  });
}
