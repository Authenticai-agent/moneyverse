import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma, withSystemContext } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSession, createRefreshTokenFamily } from '@/lib/auth/session';
import { createAccessToken } from '@/lib/auth/tokens';
import { generateCsrfToken } from '@/lib/auth/csrf';
import { setAccessCookie, setRefreshCookie, setCsrfCookie } from '@/lib/auth/cookies';
import { auditEvent } from '@/lib/audit';
import { rateLimit } from '@/lib/rate-limiter';
import { registerSchema } from '@/lib/schemas/auth';
import { getClientIp } from '@/lib/auth/ip';

export async function POST(request: NextRequest) {
  return withSystemContext(async () => {
    const db = getPrisma();

    const ip = getClientIp(request);
    const limit = rateLimit({ key: `register:${ip}`, maxRequests: 5, windowSeconds: 60 * 15 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'auth.rate_limited' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_error', issues: parsed.error.issues }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existing = await db.user.findUnique({ where: { emailNormalized: normalizedEmail } });
    if (existing) {
      throw new Error('duplicate_email');
    }

    const passwordHash = await hashPassword(password);
    const created = await db.user.create({
      data: {
        email: normalizedEmail,
        emailNormalized: normalizedEmail,
      },
    });

    await db.userCredential.create({
      data: {
        userId: created.id,
        passwordHash,
      },
    });

    const family = await db.family.create({
      data: {},
    });

    await db.familyMembership.create({
      data: {
        userId: created.id,
        familyId: family.id,
        role: 'owner',
      },
    });

    const user = { user: created, familyId: family.id };

    const session = await createSession(user.user.id);
    const { token: refreshToken } = await createRefreshTokenFamily(session.id, user.user.id);
    const { token: accessToken, jti: accessJti } = await createAccessToken({
      userId: user.user.id,
      email: user.user.email,
      sessionId: session.id,
    });

    const csrfToken = generateCsrfToken();

    await setAccessCookie(accessToken);
    await setRefreshCookie(refreshToken);
    await setCsrfCookie(csrfToken);

    await auditEvent({
      actorId: user.user.id,
      action: 'auth.register',
      targetType: 'user',
      targetId: user.user.id,
      result: 'success',
      correlationId: accessJti,
    });

    await auditEvent({
      actorId: user.user.id,
      action: 'family.created',
      targetType: 'family',
      targetId: user.familyId,
      result: 'success',
      correlationId: accessJti,
    });

    return NextResponse.json({
      user: { id: user.user.id, email: user.user.email },
      csrfToken,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'duplicate_email') {
      await auditEvent({
        action: 'auth.register',
        targetType: 'user',
        result: 'blocked',
        reasonCode: 'duplicate_email',
      });
      return NextResponse.json({ error: 'auth.duplicate_email' }, { status: 409 });
    }

    await auditEvent({
      action: 'auth.register',
      targetType: 'user',
      result: 'failure',
      reasonCode: 'unknown_error',
    });

    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
  });
}
