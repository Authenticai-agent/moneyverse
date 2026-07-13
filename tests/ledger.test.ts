import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { testApiHandler } from 'next-test-api-route-handler';
import { prisma, withRlsContext, withSystemContext, getPrisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { createAccessToken } from '@/lib/auth/tokens';
import { createEntry, getBalance, getEntries } from '@/lib/ledger';
import * as ledgerHandler from '@/app/api/families/current/children/[childId]/ledger/route';

async function createFamily(email: string) {
  const userId = randomUUID();
  const familyId = randomUUID();
  const passwordHash = await hashPassword('securePassword12!');

  await withSystemContext(async () => {
    const db = getPrisma();
    await db.user.create({
      data: {
        id: userId,
        email,
        emailNormalized: email.toLowerCase(),
        status: 'active',
      },
    });
    await db.userCredential.create({
      data: { userId, passwordHash },
    });
    await db.family.create({
      data: { id: familyId, name: 'Test Family' },
    });
    await db.familyMembership.create({
      data: { userId, familyId, role: 'owner' },
    });
  });

  return { user: { id: userId, email }, familyId };
}

async function createChild(familyId: string, nickname: string, age: number) {
  let childId = '';
  await withSystemContext(async () => {
    const db = getPrisma();
    const child = await db.childProfile.create({
      data: { familyId, nickname, age },
    });
    childId = child.id;
  });
  return childId;
}

async function issueAccessToken(user: { id: string; email: string }) {
  const session = await withSystemContext(async () => createSession(user.id));
  const { token } = await createAccessToken({
    userId: user.id,
    email: user.email,
    sessionId: session.id,
  });
  return token;
}

describe('Immutable virtual ledger', () => {
  it('creates an account and ledger entry on demand', async () => {
    const family = await createFamily('ledger-create@example.com');
    const childId = await createChild(family.familyId, 'Ledger Child', 9);

    const result = await withRlsContext({ userId: family.user.id, familyId: family.familyId }, async () => {
      return createEntry({
        childId,
        currency: 'learning_xp',
        amountMinor: 75,
        sourceType: 'test',
        sourceId: randomUUID(),
        idempotencyKey: `ledger:${childId}:test:1`,
        actorId: family.user.id,
      });
    });

    expect(result).toBe('created');

    const balance = await withRlsContext({ userId: family.user.id, familyId: family.familyId }, async () => {
      return getBalance(childId, 'learning_xp');
    });

    expect(balance).toBe(75);
  });

  it('blocks duplicate idempotency keys safely', async () => {
    const family = await createFamily('ledger-idempotent@example.com');
    const childId = await createChild(family.familyId, 'Idempotent Child', 9);

    const idempotencyKey = `ledger:${childId}:test:2`;

    const first = await withRlsContext({ userId: family.user.id, familyId: family.familyId }, async () => {
      return createEntry({
        childId,
        currency: 'learning_xp',
        amountMinor: 50,
        sourceType: 'test',
        idempotencyKey,
        actorId: family.user.id,
      });
    });

    expect(first).toBe('created');

    const second = await withRlsContext({ userId: family.user.id, familyId: family.familyId }, async () => {
      return createEntry({
        childId,
        currency: 'learning_xp',
        amountMinor: 50,
        sourceType: 'test',
        idempotencyKey,
        actorId: family.user.id,
      });
    });

    expect(second).toBe('blocked');

    const balance = await withRlsContext({ userId: family.user.id, familyId: family.familyId }, async () => {
      return getBalance(childId, 'learning_xp');
    });

    expect(balance).toBe(50);
  });

  it('rejects debit entries that would create a negative balance', async () => {
    const family = await createFamily('ledger-debit@example.com');
    const childId = await createChild(family.familyId, 'Debit Child', 9);

    await withRlsContext({ userId: family.user.id, familyId: family.familyId }, async () => {
      await createEntry({
        childId,
        currency: 'learning_xp',
        amountMinor: 100,
        sourceType: 'test',
        idempotencyKey: `ledger:${childId}:credit:1`,
        actorId: family.user.id,
      });
    });

    await expect(
      withRlsContext({ userId: family.user.id, familyId: family.familyId }, async () => {
        return createEntry({
          childId,
          currency: 'learning_xp',
          amountMinor: 150,
          entryType: 'debit',
          sourceType: 'test',
          idempotencyKey: `ledger:${childId}:debit:1`,
          actorId: family.user.id,
        });
      })
    ).rejects.toThrow('ledger.insufficient_funds');
  });

  it('lists ledger entries and balance through the API', async () => {
    const family = await createFamily('ledger-api@example.com');
    const childId = await createChild(family.familyId, 'API Ledger Child', 9);

    await withRlsContext({ userId: family.user.id, familyId: family.familyId }, async () => {
      await createEntry({
        childId,
        currency: 'learning_xp',
        amountMinor: 30,
        sourceType: 'test',
        idempotencyKey: `ledger:${childId}:api:1`,
        actorId: family.user.id,
      });
      await createEntry({
        childId,
        currency: 'learning_xp',
        amountMinor: 20,
        sourceType: 'test',
        idempotencyKey: `ledger:${childId}:api:2`,
        actorId: family.user.id,
      });
    });

    const token = await issueAccessToken(family.user);

    await testApiHandler({
      appHandler: ledgerHandler,
      params: { childId },
      url: '/?currency=learning_xp',
      async test({ fetch }) {
        const res = await fetch({
          method: 'GET',
          headers: { cookie: `access_token=${token}` },
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.currency).toBe('learning_xp');
        expect(json.balance).toBe(50);
        expect(json.entries).toHaveLength(2);
      },
    });
  });

  it('prevents a parent from reading another family ledger', async () => {
    const familyA = await createFamily('ledger-cross-a@example.com');
    const familyB = await createFamily('ledger-cross-b@example.com');
    const childB = await createChild(familyB.familyId, 'B Child', 9);

    await withRlsContext({ userId: familyB.user.id, familyId: familyB.familyId }, async () => {
      await createEntry({
        childId: childB,
        currency: 'learning_xp',
        amountMinor: 40,
        sourceType: 'test',
        idempotencyKey: `ledger:${childB}:cross:1`,
        actorId: familyB.user.id,
      });
    });

    const tokenA = await issueAccessToken(familyA.user);

    await testApiHandler({
      appHandler: ledgerHandler,
      params: { childId: childB },
      url: '/?currency=learning_xp',
      async test({ fetch }) {
        const res = await fetch({
          method: 'GET',
          headers: { cookie: `access_token=${tokenA}` },
        });
        expect(res.status).toBe(404);
      },
    });
  });

  it('returns 401 without an access token', async () => {
    const family = await createFamily('ledger-auth@example.com');
    const childId = await createChild(family.familyId, 'Auth Child', 9);

    await testApiHandler({
      appHandler: ledgerHandler,
      params: { childId },
      url: '/?currency=learning_xp',
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
      },
    });
  });
});
