import { testApiHandler } from 'next-test-api-route-handler';
import { describe, it, expect } from 'vitest';
import { withSystemContext, getPrisma } from '@/lib/prisma';
import * as registerHandler from '@/app/api/auth/register/route';
import * as loginHandler from '@/app/api/auth/login/route';
import * as currentChildrenHandler from '@/app/api/families/current/children/route';
import * as childDetailHandler from '@/app/api/families/current/children/[childId]/route';
import * as familyChildrenHandler from '@/app/api/families/[familyId]/children/route';
import * as familyChildDetailHandler from '@/app/api/families/[familyId]/children/[childId]/route';

const TEST_CSRF = 'a'.repeat(64);

function findCookie(cookies: Record<string, string>[], name: string): string | undefined {
  for (const jar of cookies) {
    if (name in jar) return jar[name];
  }
  return undefined;
}

async function createParent(email: string) {
  let accessToken: string | undefined;
  let familyId: string | undefined;

  await testApiHandler({
    appHandler: registerHandler,
    requestPatcher(request) { request.headers.set('cookie', 'csrf_token=' + TEST_CSRF); },
    async test({ fetch }) {
      const res = await fetch({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'securePassword12!', csrfToken: TEST_CSRF }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      const cookies = (res as unknown as { cookies: Record<string, string>[] }).cookies;
      accessToken = findCookie(cookies, 'access_token');
      const user = await withSystemContext(async () => {
        const db = getPrisma();
        return db.user.findUnique({ where: { email } });
      });
      const membership = await withSystemContext(async () => {
        const db = getPrisma();
        return db.familyMembership.findFirst({ where: { userId: user!.id } });
      });
      familyId = membership!.familyId;
    },
  });

  return { accessToken, familyId };
}

async function createChild(accessToken: string, nickname: string, age: number) {
  let childId: string | undefined;

  await testApiHandler({
    appHandler: currentChildrenHandler,
    requestPatcher(request) {
      request.headers.set('cookie', `access_token=${accessToken}`);
    },
    async test({ fetch }) {
      const res = await fetch({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, age }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      childId = json.child.id;
    },
  });

  return childId!;
}

describe('Family and child profiles', () => {
  it('parent creates one or more child profiles without full date of birth', async () => {
    const { accessToken } = await createParent('family@example.com');
    const childId = await createChild(accessToken!, 'Sky', 9);

    const child = await withSystemContext(async () => {
      const db = getPrisma();
      return db.childProfile.findUnique({ where: { id: childId } });
    });
    expect(child?.nickname).toBe('Sky');
    expect(child?.age).toBe(9);
  });

  it('parent can create multiple child profiles', async () => {
    const { accessToken } = await createParent('multi@example.com');
    const first = await createChild(accessToken!, 'Sky', 9);
    const second = await createChild(accessToken!, 'River', 6);

    const children = await withSystemContext(async () => {
      const db = getPrisma();
      const child = await db.childProfile.findUnique({ where: { id: first } });
      return db.childProfile.findMany({ where: { familyId: child?.familyId } });
    });
    expect(children.length).toBe(2);
    expect(children.map((c) => c.id).sort()).toEqual([first, second].sort());
  });

  it('parent A cannot read parent B child via family route', async () => {
    const parentA = await createParent('a@example.com');
    const parentB = await createParent('b@example.com');
    const childB = await createChild(parentB.accessToken!, 'B Child', 9);

    await testApiHandler({
      appHandler: familyChildrenHandler,
      paramsPatcher(params) {
        params.familyId = parentB.familyId!;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${parentA.accessToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(403);
      },
    });

    await testApiHandler({
      appHandler: familyChildDetailHandler,
      paramsPatcher(params) {
        params.familyId = parentB.familyId!;
        params.childId = childB;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${parentA.accessToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(403);
      },
    });
  });

  it('parent cannot access child dashboard without authentication', async () => {
    await testApiHandler({
      appHandler: childDetailHandler,
      paramsPatcher(params) {
        params.childId = 'not-a-real-child';
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(401);
      },
    });
  });

  it('child profile creation is authorized and audited', async () => {
    const { accessToken, familyId } = await createParent('audit-child@example.com');
    const childId = await createChild(accessToken!, ' audited', 9);

    const events = await withSystemContext(async () => {
      const db = getPrisma();
      return db.auditEvent.findMany({
        where: { action: 'child_profile.created', targetId: childId },
      });
    });
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].result).toBe('success');
  });
});
