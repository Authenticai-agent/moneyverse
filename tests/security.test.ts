import { testApiHandler } from 'next-test-api-route-handler';
import { describe, it, expect } from 'vitest';
import { withSystemContext, getPrisma } from '@/lib/prisma';
import { createAccessToken, verifyAccessToken } from '@/lib/auth/tokens';
import { createSession } from '@/lib/auth/session';
import { auditEvent } from '@/lib/audit';
import * as meHandler from '@/app/api/me/route';
import { randomUUID } from 'crypto';

describe('Security invariants', () => {
  it('rejects a token with wrong issuer', async () => {
    const user = await withSystemContext(async () => {
      const db = getPrisma();
      return db.user.create({
        data: { email: 'iss@example.com', emailNormalized: 'iss@example.com' },
      });
    });
    const session = await withSystemContext(async () => createSession(user.id));
    const token = await createAccessToken({ userId: user.id, email: user.email, sessionId: session.id });
    const parts = token.token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    payload.iss = 'attacker';
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const tampered = parts.join('.');

    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  it('rejects a token with wrong audience', async () => {
    const user = await withSystemContext(async () => {
      const db = getPrisma();
      return db.user.create({
        data: { email: 'aud@example.com', emailNormalized: 'aud@example.com' },
      });
    });
    const session = await withSystemContext(async () => createSession(user.id));
    const token = await createAccessToken({ userId: user.id, email: user.email, sessionId: session.id });
    const parts = token.token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    payload.aud = 'attacker';
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const tampered = parts.join('.');

    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    const user = await withSystemContext(async () => {
      const db = getPrisma();
      return db.user.create({
        data: { email: 'exp@example.com', emailNormalized: 'exp@example.com' },
      });
    });
    const session = await withSystemContext(async () => createSession(user.id));
    const token = await createAccessToken({ userId: user.id, email: user.email, sessionId: session.id });
    const parts = token.token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    payload.exp = Math.floor(Date.now() / 1000) - 1000;
    payload.iat = Math.floor(Date.now() / 1000) - 2000;
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const tampered = parts.join('.');

    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  it('rejects a token with invalid signature', async () => {
    const user = await withSystemContext(async () => {
      const db = getPrisma();
      return db.user.create({
        data: { email: 'sig@example.com', emailNormalized: 'sig@example.com' },
      });
    });
    const session = await withSystemContext(async () => createSession(user.id));
    const token = await createAccessToken({ userId: user.id, email: user.email, sessionId: session.id });
    const tampered = token.token.replace(/\..*$/, '.invalid-signature');

    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  it('rejects tokens after session revocation', async () => {
    const user = await withSystemContext(async () => {
      const db = getPrisma();
      return db.user.create({
        data: { email: 'revoke@example.com', emailNormalized: 'revoke@example.com' },
      });
    });
    const session = await withSystemContext(async () => createSession(user.id));
    const token = await createAccessToken({ userId: user.id, email: user.email, sessionId: session.id });

    await withSystemContext(async () => {
      const db = getPrisma();
      await db.userSession.update({
        where: { id: session.id },
        data: { status: 'revoked', revokedAt: new Date(), revokedReason: 'test' },
      });
    });

    await testApiHandler({
      appHandler: meHandler,
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${token.token}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
      },
    });
  });

  it('redacts sensitive metadata in audit events', async () => {
    const user = await withSystemContext(async () => {
      const db = getPrisma();
      return db.user.create({
        data: { email: 'redact@example.com', emailNormalized: 'redact@example.com' },
      });
    });

    await withSystemContext(async () =>
      auditEvent({
        actorId: user.id,
        action: 'auth.login',
        targetType: 'user',
        targetId: user.id,
        result: 'success',
        metadata: { password: 'secret123', refreshToken: 'abc', public: 'visible' },
      })
    );

    const event = await withSystemContext(async () => {
      const db = getPrisma();
      return db.auditEvent.findFirst({
        where: { actorId: user.id },
        orderBy: { createdAt: 'desc' },
      });
    });

    const metadata = event?.metadata as Record<string, unknown>;
    expect(metadata.password).toBe('[REDACTED]');
    expect(metadata.refreshToken).toBe('[REDACTED]');
    expect(metadata.public).toBe('visible');
  });

  it('does not contain secrets in server responses', async () => {
    const user = await withSystemContext(async () => {
      const db = getPrisma();
      return db.user.create({
        data: { email: 'leak@example.com', emailNormalized: 'leak@example.com' },
      });
    });
    const session = await withSystemContext(async () => createSession(user.id));
    const token = await createAccessToken({ userId: user.id, email: user.email, sessionId: session.id });

    await testApiHandler({
      appHandler: meHandler,
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${token.token}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        const text = await res.text();
        expect(text).not.toContain(process.env.JWT_SECRET ?? '');
        expect(text).not.toContain('secret');
      },
    });
  });
});
