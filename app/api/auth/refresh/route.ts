import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'argon2';
import { getPrisma, withSystemContext } from '@/lib/prisma';
import { createAccessToken } from '@/lib/auth/tokens';
import { generateCsrfToken } from '@/lib/auth/csrf';
import { getRefreshCookie, setAccessCookie, setRefreshCookie, setCsrfCookie } from '@/lib/auth/cookies';
import { revokeFamily, createRefreshTokenFamily, revokeSession } from '@/lib/auth/session';
import { auditEvent, securityEvent } from '@/lib/audit';
import { rateLimit } from '@/lib/rate-limiter';
import { getClientIp } from '@/lib/auth/ip';

export async function POST(request: NextRequest) {
  return withSystemContext(async () => {
    const db = getPrisma();

    const ip = getClientIp(request);
    const limit = rateLimit({ key: `refresh:${ip}`, maxRequests: 30, windowSeconds: 60 * 15 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'auth.rate_limited' }, { status: 429 });
  }

  const refreshToken = await getRefreshCookie();
  if (!refreshToken) {
    return NextResponse.json({ error: 'auth.unauthorized' }, { status: 401 });
  }

  const candidates = await db.refreshTokenFamily.findMany({
    where: { revokedAt: null },
    include: { session: true, user: true },
  });

  let family: typeof candidates[number] | undefined;
  let tokenValid = false;
  let previousValid = false;

  for (const candidate of candidates) {
    if (candidate.session.status !== 'active' || candidate.session.expiresAt < new Date()) {
      continue;
    }

    const currentValid = await verify(candidate.currentTokenHash, refreshToken);
    const prevValid = candidate.previousTokenHash ? await verify(candidate.previousTokenHash, refreshToken) : false;

    if (currentValid || prevValid) {
      family = candidate;
      tokenValid = currentValid;
      previousValid = prevValid;
      break;
    }
  }

  if (!family) {
    await securityEvent({
      action: 'refresh_token_invalid_used',
      targetType: 'refresh_token_family',
      result: 'blocked',
      reasonCode: 'invalid_token',
    });
    return NextResponse.json({ error: 'auth.unauthorized' }, { status: 401 });
  }

  if (!tokenValid && previousValid) {
    // Token reuse: the previous token was already rotated, and now it is presented again.
    await revokeFamily(family.id, 'refresh_token_reuse_detected');
    await revokeSession(family.session.id, 'refresh_token_family_revoked');
    await securityEvent({
      actorId: family.userId,
      action: 'auth.refresh_reuse_detected',
      targetType: 'refresh_token_family',
      targetId: family.id,
      result: 'blocked',
      reasonCode: 'reuse',
    });
    return NextResponse.json({ error: 'auth.unauthorized' }, { status: 401 });
  }

  // At this point tokenValid is true and the current token is the latest. Rotate it.
  let newRefreshToken: string;
  try {
    newRefreshToken = await rotateAndGetToken(family.id, family.currentTokenHash, family.previousTokenHash);
  } catch {
    await revokeFamily(family.id, 'rotation_failed');
    await revokeSession(family.session.id, 'rotation_failed');
    return NextResponse.json({ error: 'auth.unauthorized' }, { status: 401 });
  }

  const { token: accessToken, jti: accessJti } = await createAccessToken({
    userId: family.userId,
    email: family.user.email,
    sessionId: family.session.id,
  });

  const csrfToken = generateCsrfToken();

  await setAccessCookie(accessToken);
  await setRefreshCookie(newRefreshToken);
  await setCsrfCookie(csrfToken);

  await auditEvent({
    actorId: family.userId,
    action: 'auth.refresh',
    targetType: 'session',
    targetId: family.session.id,
    result: 'success',
    correlationId: accessJti,
  });

  return NextResponse.json({ csrfToken });
  });
}

async function rotateAndGetToken(
  familyId: string,
  currentTokenHash: string,
  previousTokenHash: string | null
): Promise<string> {
  const newToken = generateToken();
  const { hash } = await import('argon2');
  const newTokenHash = await hash(newToken, { type: 2 });

  const db = getPrisma();
  await db.refreshTokenFamily.update({
    where: { id: familyId, currentTokenHash },
    data: {
      currentTokenHash: newTokenHash,
      previousTokenHash: previousTokenHash ? previousTokenHash : currentTokenHash,
      rotatedAt: new Date(),
    },
  });

  return newToken;
}

function generateToken(): string {
  const { randomBytes } = require('crypto');
  return randomBytes(64).toString('hex');
}
