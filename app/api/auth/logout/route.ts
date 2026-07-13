import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withRlsContext } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/tokens';
import { deleteAccessCookie, deleteRefreshCookie, deleteCsrfCookie } from '@/lib/auth/cookies';
import { revokeSession } from '@/lib/auth/session';
import { auditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const token = (await cookies()).get('access_token')?.value;
  await deleteAccessCookie();
  await deleteRefreshCookie();
  await deleteCsrfCookie();

  if (!token) {
    return NextResponse.json({ ok: true });
  }

  try {
    const claims = await verifyAccessToken(token);
    await withRlsContext({ userId: claims.sub }, async () => {
      await revokeSession(claims.sessionId, 'user_logout');
      await auditEvent({
        actorId: claims.sub,
        action: 'auth.logout',
        targetType: 'session',
        targetId: claims.sessionId,
        result: 'success',
      });
    });
  } catch {
    // ignore invalid token
  }

  return NextResponse.json({ ok: true });
}
