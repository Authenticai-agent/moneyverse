import { testApiHandler } from 'next-test-api-route-handler';
import { describe, it, expect, beforeEach } from 'vitest';
import { withSystemContext, getPrisma } from '@/lib/prisma';
import * as registerHandler from '@/app/api/auth/register/route';
import * as loginHandler from '@/app/api/auth/login/route';
import * as refreshHandler from '@/app/api/auth/refresh/route';
import * as logoutHandler from '@/app/api/auth/logout/route';
import * as meHandler from '@/app/api/me/route';
import { createAccessToken, verifyAccessToken } from '@/lib/auth/tokens';
import { createSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { resetRateLimit } from '@/lib/rate-limiter';
import { randomUUID } from 'crypto';

function findCookie(cookies: Record<string, string>[], name: string): string | undefined {
  for (const jar of cookies) {
    if (name in jar) return jar[name];
  }
  return undefined;
}

async function registerUser(email: string, password: string) {
  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  let csrfToken: string | undefined;

  await testApiHandler({
    appHandler: registerHandler,
    async test({ fetch }) {
      const res = await fetch({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.user.email).toBe(email.toLowerCase());
      expect(json.csrfToken).toBeDefined();
      const cookies = (res as unknown as { cookies: Record<string, string>[] }).cookies;
      accessToken = findCookie(cookies, 'access_token');
      refreshToken = findCookie(cookies, 'refresh_token');
      csrfToken = json.csrfToken;
    },
  });

  return { accessToken, refreshToken, csrfToken };
}

async function loginUser(email: string, password: string) {
  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  let csrfToken: string | undefined;

  await testApiHandler({
    appHandler: loginHandler,
    async test({ fetch }) {
      const res = await fetch({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, csrfToken: 'ignored' }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      const cookies = (res as unknown as { cookies: Record<string, string>[] }).cookies;
      accessToken = findCookie(cookies, 'access_token');
      refreshToken = findCookie(cookies, 'refresh_token');
      csrfToken = json.csrfToken;
    },
  });

  return { accessToken, refreshToken, csrfToken };
}

describe('Authentication', () => {
  beforeEach(() => {
    resetRateLimit();
  });

  it('registers an adult with valid credentials', async () => {
    const { accessToken } = await registerUser('parent@example.com', 'securePassword12!');
    expect(accessToken).toBeDefined();

    const user = await withSystemContext(async () => {
      const db = getPrisma();
      return db.user.findUnique({ where: { email: 'parent@example.com' } });
    });
    expect(user).not.toBeNull();
    const membership = await withSystemContext(async () => {
      const db = getPrisma();
      return db.familyMembership.findFirst({ where: { userId: user!.id } });
    });
    expect(membership?.role).toBe('owner');
  });

  it('rejects duplicate email safely', async () => {
    await registerUser('dup@example.com', 'securePassword12!');

    await testApiHandler({
      appHandler: registerHandler,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'dup@example.com', password: 'anotherPassword12!' }),
        });
        expect(res.status).toBe(409);
      },
    });
  });

  it('stores passwords using Argon2id', async () => {
    await registerUser('argon@example.com', 'securePassword12!');
    const credential = await withSystemContext(async () => {
      const db = getPrisma();
      return db.userCredential.findFirst({
        where: { user: { email: 'argon@example.com' } },
      });
    });
    expect(credential?.passwordHash).toContain('$argon2id$');
  });

  it('logs an adult in', async () => {
    await registerUser('login@example.com', 'securePassword12!');
    const { accessToken } = await loginUser('login@example.com', 'securePassword12!');
    expect(accessToken).toBeDefined();
  });

  it('rejects invalid credentials without exposing account existence', async () => {
    await testApiHandler({
      appHandler: loginHandler,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'missing@example.com', password: 'securePassword12!', csrfToken: 'x' }),
        });
        expect(res.status).toBe(401);
        const json = await res.json();
        expect(json.error).toBe('auth.invalid_credentials');
      },
    });
  });

  it('validates access token issuer, audience, expiry, signature, and type', async () => {
    const user = await withSystemContext(async () => {
      const db = getPrisma();
      return db.user.create({
        data: {
          email: 'token@example.com',
          emailNormalized: 'token@example.com',
        },
      });
    });
    const session = await withSystemContext(async () => createSession(user.id));
    const { token } = await createAccessToken({ userId: user.id, email: user.email, sessionId: session.id });

    const claims = await verifyAccessToken(token);
    expect(claims.sub).toBe(user.id);
    expect(claims.type).toBe('access');
    expect(claims.iss).toBe('moneyverse');
    expect(claims.aud).toBe('moneyverse-app');
    expect(claims.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it('rejects wrong token type', async () => {
    const user = await withSystemContext(async () => {
      const db = getPrisma();
      return db.user.create({
        data: {
          email: 'type@example.com',
          emailNormalized: 'type@example.com',
        },
      });
    });
    const session = await withSystemContext(async () => createSession(user.id));
    const token = await createAccessToken({ userId: user.id, email: user.email, sessionId: session.id });
    // Tamper token to use unsupported token
    const parts = token.token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    payload.type = 'refresh';
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const tampered = parts.join('.');

    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  it('rotates refresh token on every successful use', async () => {
    await registerUser('refresh@example.com', 'securePassword12!');
    const { refreshToken: first } = await loginUser('refresh@example.com', 'securePassword12!');
    expect(first).toBeDefined();

    let secondRefreshToken: string | undefined;
    await testApiHandler({
      appHandler: refreshHandler,
      requestPatcher(request) {
        request.headers.set('cookie', `refresh_token=${first}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(200);
        const cookies = (res as unknown as { cookies: Record<string, string>[] }).cookies;
        secondRefreshToken = findCookie(cookies, 'refresh_token');
      },
    });

    expect(secondRefreshToken).toBeDefined();
    expect(secondRefreshToken).not.toBe(first);

    await testApiHandler({
      appHandler: refreshHandler,
      requestPatcher(request) {
        request.headers.set('cookie', `refresh_token=${secondRefreshToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(200);
      },
    });
  });

  it('revokes refresh token family on replay', async () => {
    await registerUser('replay@example.com', 'securePassword12!');
    const { refreshToken: first } = await loginUser('replay@example.com', 'securePassword12!');

    let secondRefreshToken: string | undefined;
    await testApiHandler({
      appHandler: refreshHandler,
      requestPatcher(request) {
        request.headers.set('cookie', `refresh_token=${first}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(200);
        const cookies = (res as unknown as { cookies: Record<string, string>[] }).cookies;
        secondRefreshToken = findCookie(cookies, 'refresh_token');
      },
    });

    // Replay the first token
    await testApiHandler({
      appHandler: refreshHandler,
      requestPatcher(request) {
        request.headers.set('cookie', `refresh_token=${first}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(401);
      },
    });

    // New token should also fail because family is revoked
    await testApiHandler({
      appHandler: refreshHandler,
      requestPatcher(request) {
        request.headers.set('cookie', `refresh_token=${secondRefreshToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(401);
      },
    });
  });

  it('creates audit events for security actions', async () => {
    await registerUser('audit@example.com', 'securePassword12!');
    const events = await withSystemContext(async () => {
      const db = getPrisma();
      return db.auditEvent.findMany({
        where: { action: 'auth.register' },
      });
    });
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].metadata).toBeNull();
  });

  it('rate limits login attempts', async () => {
    await registerUser('rate@example.com', 'securePassword12!');
    for (let i = 0; i < 12; i++) {
      await testApiHandler({
        appHandler: loginHandler,
        async test({ fetch }) {
          await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'rate@example.com', password: 'wrong', csrfToken: 'x' }),
          });
        },
      });
    }

    await testApiHandler({
      appHandler: loginHandler,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'rate@example.com', password: 'securePassword12!', csrfToken: 'x' }),
        });
        expect(res.status).toBe(429);
      },
    });
  });

  it('exposes no secrets in responses', async () => {
    await registerUser('secret@example.com', 'securePassword12!');
    await testApiHandler({
      appHandler: loginHandler,
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'secret@example.com', password: 'securePassword12!', csrfToken: 'x' }),
        });
        const text = await res.text();
        expect(text).not.toContain('securePassword12!');
        expect(text).not.toContain('$argon2id');
      },
    });
  });
});
