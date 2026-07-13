import { randomBytes, randomUUID } from 'crypto';
import { getPrisma } from '../prisma';
import { REFRESH_TOKEN_TTL_SECONDS, SESSION_TTL_SECONDS } from '../config';
import { hash } from 'argon2';

export function generateRefreshToken(): string {
  return randomBytes(64).toString('hex');
}

export async function hashRefreshToken(token: string): Promise<string> {
  return hash(token, { type: 2 /* argon2id */ });
}

export async function createSession(userId: string, device?: string) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const db = getPrisma();
  const session = await db.userSession.create({
    data: {
      userId,
      status: 'active',
      device: device ? device.slice(0, 200) : undefined,
      expiresAt,
    },
  });
  return session;
}

export async function createRefreshTokenFamily(sessionId: string, userId: string) {
  const token = generateRefreshToken();
  const tokenHash = await hashRefreshToken(token);
  const db = getPrisma();
  const family = await db.refreshTokenFamily.create({
    data: {
      userId,
      sessionId,
      currentTokenHash: tokenHash,
      rotatedAt: new Date(),
    },
  });
  return { family, token };
}

export async function rotateRefreshToken(
  familyId: string,
  currentTokenHash: string,
  oldTokenHash: string
) {
  const newToken = generateRefreshToken();
  const newTokenHash = await hashRefreshToken(newToken);

  const db = getPrisma();
  await db.refreshTokenFamily.update({
    where: { id: familyId, currentTokenHash },
    data: {
      currentTokenHash: newTokenHash,
      previousTokenHash: oldTokenHash,
      rotatedAt: new Date(),
    },
  });

  return newToken;
}

export async function revokeFamily(familyId: string, reason: string) {
  const db = getPrisma();
  await db.refreshTokenFamily.update({
    where: { id: familyId },
    data: {
      revokedAt: new Date(),
      revokedReason: reason.slice(0, 200),
    },
  });
}

export async function revokeSession(sessionId: string, reason: string) {
  const db = getPrisma();
  await db.userSession.update({
    where: { id: sessionId },
    data: {
      status: 'revoked',
      revokedAt: new Date(),
      revokedReason: reason.slice(0, 200),
    },
  });
}
