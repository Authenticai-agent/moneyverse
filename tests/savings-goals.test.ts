import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { testApiHandler } from 'next-test-api-route-handler';
import { prisma, withRlsContext, withSystemContext, getPrisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { createAccessToken } from '@/lib/auth/tokens';
import { createEntry } from '@/lib/ledger';
import * as savingsGoalsHandler from '@/app/api/families/current/children/[childId]/savings-goals/route';
import * as goalHandler from '@/app/api/families/current/children/[childId]/savings-goals/[goalId]/route';
import * as allocateHandler from '@/app/api/families/current/children/[childId]/savings-goals/[goalId]/allocate/route';

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

async function seedCash(familyId: string, userId: string, childId: string, amountMinor: number) {
  await withRlsContext({ userId, familyId }, async () => {
    await createEntry({
      childId,
      currency: 'simulated_cash',
      amountMinor,
      sourceType: 'test',
      idempotencyKey: `savings:${childId}:seed:${randomUUID()}`,
      actorId: userId,
    });
  });
}

describe('Savings goals', () => {
  it('creates a savings goal for a child', async () => {
    const family = await createFamily('savings-create@example.com');
    const childId = await createChild(family.familyId, 'Savings Child', 9);
    const token = await issueAccessToken(family.user);

    await testApiHandler({
      appHandler: savingsGoalsHandler,
      params: { childId },
      url: '/',
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            cookie: `access_token=${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            title: 'New Bike',
            targetAmountMinor: 10000,
            currency: 'simulated_cash',
          }),
        });
        expect(res.status).toBe(201);
        const json = await res.json();
        expect(json.goal.title).toBe('New Bike');
        expect(json.goal.targetAmountMinor).toBe(10000);
        expect(json.goal.currentAmountMinor).toBe(0);
      },
    });
  });

  it('lists savings goals with progress', async () => {
    const family = await createFamily('savings-list@example.com');
    const childId = await createChild(family.familyId, 'List Child', 9);
    const token = await issueAccessToken(family.user);

    await seedCash(family.familyId, family.user.id, childId, 5000);

    let goalId = '';
    await testApiHandler({
      appHandler: savingsGoalsHandler,
      params: { childId },
      url: '/',
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            cookie: `access_token=${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Toy',
            targetAmountMinor: 3000,
            currency: 'simulated_cash',
          }),
        });
        expect(res.status).toBe(201);
        const json = await res.json();
        goalId = json.goal.id;
      },
    });

    await testApiHandler({
      appHandler: allocateHandler,
      params: { childId, goalId },
      url: '/',
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            cookie: `access_token=${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ amountMinor: 1500 }),
        });
        expect(res.status).toBe(200);
      },
    });

    await testApiHandler({
      appHandler: savingsGoalsHandler,
      params: { childId },
      url: '/',
      async test({ fetch }) {
        const res = await fetch({
          method: 'GET',
          headers: { cookie: `access_token=${token}` },
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.goals).toHaveLength(1);
        expect(json.goals[0].currentAmountMinor).toBe(1500);
      },
    });
  });

  it('updates a savings goal', async () => {
    const family = await createFamily('savings-update@example.com');
    const childId = await createChild(family.familyId, 'Update Child', 9);
    const token = await issueAccessToken(family.user);

    let goalId = '';
    await testApiHandler({
      appHandler: savingsGoalsHandler,
      params: { childId },
      url: '/',
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            cookie: `access_token=${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Old Title',
            targetAmountMinor: 1000,
          }),
        });
        expect(res.status).toBe(201);
        const json = await res.json();
        goalId = json.goal.id;
      },
    });

    await testApiHandler({
      appHandler: goalHandler,
      params: { childId, goalId },
      url: '/',
      async test({ fetch }) {
        const res = await fetch({
          method: 'PATCH',
          headers: {
            cookie: `access_token=${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ title: 'New Title', targetAmountMinor: 2000 }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.goal.title).toBe('New Title');
        expect(json.goal.targetAmountMinor).toBe(2000);
      },
    });
  });

  it('allocates funds to a goal and updates progress', async () => {
    const family = await createFamily('savings-allocate@example.com');
    const childId = await createChild(family.familyId, 'Allocate Child', 9);
    const token = await issueAccessToken(family.user);

    await seedCash(family.familyId, family.user.id, childId, 5000);

    let goalId = '';
    await testApiHandler({
      appHandler: savingsGoalsHandler,
      params: { childId },
      url: '/',
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            cookie: `access_token=${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Game',
            targetAmountMinor: 4000,
          }),
        });
        expect(res.status).toBe(201);
        const json = await res.json();
        goalId = json.goal.id;
      },
    });

    await testApiHandler({
      appHandler: allocateHandler,
      params: { childId, goalId },
      url: '/',
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            cookie: `access_token=${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ amountMinor: 2500 }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.goal.currentAmountMinor).toBe(2500);
      },
    });
  });

  it('prevents allocation exceeding available simulated cash', async () => {
    const family = await createFamily('savings-insufficient@example.com');
    const childId = await createChild(family.familyId, 'Insufficient Child', 9);
    const token = await issueAccessToken(family.user);

    await seedCash(family.familyId, family.user.id, childId, 1000);

    let goalId = '';
    await testApiHandler({
      appHandler: savingsGoalsHandler,
      params: { childId },
      url: '/',
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            cookie: `access_token=${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Expensive',
            targetAmountMinor: 5000,
          }),
        });
        expect(res.status).toBe(201);
        const json = await res.json();
        goalId = json.goal.id;
      },
    });

    await testApiHandler({
      appHandler: allocateHandler,
      params: { childId, goalId },
      url: '/',
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: {
            cookie: `access_token=${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ amountMinor: 2000 }),
        });
        expect(res.status).toBe(400);
      },
    });
  });

  it('blocks a parent from accessing another family savings goal', async () => {
    const familyA = await createFamily('savings-cross-a@example.com');
    const familyB = await createFamily('savings-cross-b@example.com');
    const childB = await createChild(familyB.familyId, 'B Child', 9);
    const tokenA = await issueAccessToken(familyA.user);

    await seedCash(familyB.familyId, familyB.user.id, childB, 1000);

    let goalId = '';
    await withRlsContext({ userId: familyB.user.id, familyId: familyB.familyId }, async () => {
      const db = getPrisma();
      const goal = await db.savingsGoal.create({
        data: {
          childId: childB,
          title: 'B Goal',
          targetAmountMinor: 500,
          currency: 'simulated_cash',
        },
      });
      goalId = goal.id;
    });

    await testApiHandler({
      appHandler: goalHandler,
      params: { childId: childB, goalId },
      url: '/',
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
    const family = await createFamily('savings-auth@example.com');
    const childId = await createChild(family.familyId, 'Auth Child', 9);

    await testApiHandler({
      appHandler: savingsGoalsHandler,
      params: { childId },
      url: '/',
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
      },
    });
  });

  it('returns 404 for a non-existent child', async () => {
    const family = await createFamily('savings-notfound@example.com');
    const token = await issueAccessToken(family.user);

    await testApiHandler({
      appHandler: savingsGoalsHandler,
      params: { childId: randomUUID() },
      url: '/',
      async test({ fetch }) {
        const res = await fetch({
          method: 'GET',
          headers: { cookie: `access_token=${token}` },
        });
        expect(res.status).toBe(404);
      },
    });
  });
});
