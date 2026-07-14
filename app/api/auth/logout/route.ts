import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withRlsContext } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/tokens';
import { deleteAccessCookie, deleteRefreshCookie, deleteCsrfCookie } from '@/lib/auth/cookies';
import { revokeSession } from '@/lib/auth/session';
import { auditEvent } from '@/lib/audit';
import { verifyCsrfToken } from '@/lib/auth/csrf-verify';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const csrfToken = typeof body === 'object' && body !== null ? (body as { csrfToken?: string }).csrfToken : undefined;
  if (!(await verifyCsrfToken(csrfToken))) {
    await auditEvent({
      action: 'auth.csrf_failed',
      targetType: 'session',
      result: 'blocked',
      reasonCode: 'csrf_invalid',
    });
    return NextResponse.json({ error: 'auth.csrf_invalid' }, { status: 403 });
  }

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
