import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, withSystemContext } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, createRefreshTokenFamily } from '@/lib/auth/session';
import { createAccessToken } from '@/lib/auth/tokens';
import { generateCsrfToken } from '@/lib/auth/csrf';
import { setAccessCookie, setRefreshCookie, setCsrfCookie } from '@/lib/auth/cookies';
import { auditEvent } from '@/lib/audit';
import { rateLimit } from '@/lib/rate-limiter';
import { loginSchema } from '@/lib/schemas/auth';
import { getClientIp } from '@/lib/auth/ip';

export async function POST(request: NextRequest) {
  return withSystemContext(async () => {
    const db = getPrisma();

    const ip = getClientIp(request);
    const limit = rateLimit({ key: `login:${ip}`, maxRequests: 10, windowSeconds: 60 * 15 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'auth.rate_limited' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_error' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await db.user.findUnique({
    where: { emailNormalized: normalizedEmail },
    include: { credentials: true },
  });

  if (!user || !user.credentials) {
    await auditEvent({
      action: 'auth.login',
      targetType: 'user',
      result: 'failure',
      reasonCode: 'invalid_credentials',
    });
    return NextResponse.json({ error: 'auth.invalid_credentials' }, { status: 401 });
  }

  const valid = await verifyPassword(user.credentials.passwordHash, password);
  if (!valid) {
    await auditEvent({
      actorId: user.id,
      action: 'auth.login',
      targetType: 'user',
      targetId: user.id,
      result: 'failure',
      reasonCode: 'invalid_credentials',
    });
    return NextResponse.json({ error: 'auth.invalid_credentials' }, { status: 401 });
  }

  if (user.status !== 'active') {
    await auditEvent({
      actorId: user.id,
      action: 'auth.login',
      targetType: 'user',
      targetId: user.id,
      result: 'blocked',
      reasonCode: 'account_inactive',
    });
    return NextResponse.json({ error: 'auth.account_inactive' }, { status: 403 });
  }

  const session = await createSession(user.id);
  const { token: refreshToken } = await createRefreshTokenFamily(session.id, user.id);
  const { token: accessToken, jti: accessJti } = await createAccessToken({
    userId: user.id,
    email: user.email,
    sessionId: session.id,
  });

  const csrfToken = generateCsrfToken();

  await setAccessCookie(accessToken);
  await setRefreshCookie(refreshToken);
  await setCsrfCookie(csrfToken);

  await auditEvent({
    actorId: user.id,
    action: 'auth.login',
    targetType: 'user',
    targetId: user.id,
    result: 'success',
    correlationId: accessJti,
  });

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    csrfToken,
  });
  });
}
