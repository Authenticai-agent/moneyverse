import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { prisma, withRlsContext, withSystemContext, getPrisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';

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
      data: {
        userId,
        passwordHash,
      },
    });
    await db.family.create({
      data: {
        id: familyId,
        name: 'Test Family',
      },
    });
    await db.familyMembership.create({
      data: {
        userId,
        familyId,
        role: 'owner',
      },
    });
  });

  return { user: { id: userId }, familyId };
}

describe('Row-Level Security', () => {
  it('isolates family data when using withRlsContext', async () => {
    const familyA = await createFamily('rls-a@example.com');
    const familyB = await createFamily('rls-b@example.com');

    await withSystemContext(async () => {
      const db = getPrisma();
      await db.childProfile.create({
        data: { familyId: familyA.familyId, nickname: 'A Child', age: 9 },
      });
      await db.childProfile.create({
        data: { familyId: familyB.familyId, nickname: 'B Child', age: 7 },
      });
    });

    const aChildren = await withRlsContext(
      { userId: familyA.user.id, familyId: familyA.familyId },
      async () => {
        const db = getPrisma();
        return db.childProfile.findMany();
      }
    );

    expect(aChildren).toHaveLength(1);
    expect(aChildren[0].nickname).toBe('A Child');
  });

  it('prevents one family from reading another family child profile', async () => {
    const familyA = await createFamily('rls-c@example.com');
    const familyB = await createFamily('rls-d@example.com');

    let bChildId = '';
    await withSystemContext(async () => {
      const db = getPrisma();
      const child = await db.childProfile.create({
        data: { familyId: familyB.familyId, nickname: 'B Child', age: 7 },
      });
      bChildId = child.id;
    });

    const found = await withRlsContext(
      { userId: familyA.user.id, familyId: familyA.familyId },
      async () => {
        const db = getPrisma();
        return db.childProfile.findUnique({ where: { id: bChildId } });
      }
    );

    expect(found).toBeNull();
  });

  it('allows system context to bypass RLS and read all rows', async () => {
    const familyA = await createFamily('rls-e@example.com');
    const familyB = await createFamily('rls-f@example.com');

    await withSystemContext(async () => {
      const db = getPrisma();
      await db.childProfile.create({
        data: { familyId: familyA.familyId, nickname: 'A Child', age: 9 },
      });
      await db.childProfile.create({
        data: { familyId: familyB.familyId, nickname: 'B Child', age: 7 },
      });
    });

    const all = await withSystemContext(async () => {
      const db = getPrisma();
      return db.childProfile.findMany();
    });

    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('blocks uncontextualized prisma queries on tenant tables', async () => {
    const family = await createFamily('rls-g@example.com');

    await withSystemContext(async () => {
      const db = getPrisma();
      await db.childProfile.create({
        data: { familyId: family.familyId, nickname: 'Only Child', age: 9 },
      });
    });

    const direct = await prisma.childProfile.findMany();
    expect(direct).toHaveLength(0);
  });

  it('keeps global curriculum tables readable without family isolation', async () => {
    await withSystemContext(async () => {
      const db = getPrisma();
      const course = await db.course.create({
        data: { title: 'Basics', slug: `course-${randomUUID()}`, status: 'published' },
      });
      const module = await db.module.create({
        data: { courseId: course.id, title: 'Intro', slug: `module-${randomUUID()}`, status: 'published' },
      });
      const lesson = await db.lesson.create({
        data: {
          moduleId: module.id,
          title: 'Welcome',
          slug: `lesson-${randomUUID()}`,
          minAge: 6,
          maxAge: 12,
          status: 'published',
        },
      });
      const version = await db.lessonVersion.create({
        data: { lessonId: lesson.id, version: 1, content: {}, status: 'published' },
      });
      await db.lesson.update({ where: { id: lesson.id }, data: { publishedVersionId: version.id } });
    });

    const family = await createFamily('rls-curriculum@example.com');
    const lessons = await withRlsContext(
      { userId: family.user.id, familyId: family.familyId },
      async () => {
        const db = getPrisma();
        return db.lesson.findMany({ where: { status: 'published' } });
      }
    );

    expect(lessons.length).toBeGreaterThanOrEqual(1);
  });

  it('prevents one family from reading another family lesson progress', async () => {
    const familyA = await createFamily('rls-progress-a@example.com');
    const familyB = await createFamily('rls-progress-b@example.com');

    let lessonVersionId = '';
    let aChildId = '';
    await withSystemContext(async () => {
      const db = getPrisma();
      const course = await db.course.create({
        data: { title: 'Basics', slug: `course-${randomUUID()}`, status: 'published' },
      });
      const module = await db.module.create({
        data: { courseId: course.id, title: 'Intro', slug: `module-${randomUUID()}`, status: 'published' },
      });
      const lesson = await db.lesson.create({
        data: {
          moduleId: module.id,
          title: 'Welcome',
          slug: `lesson-${randomUUID()}`,
          minAge: 6,
          maxAge: 12,
          status: 'published',
        },
      });
      const version = await db.lessonVersion.create({
        data: { lessonId: lesson.id, version: 1, content: {}, status: 'published' },
      });
      await db.lesson.update({ where: { id: lesson.id }, data: { publishedVersionId: version.id } });
      lessonVersionId = version.id;

      const aChild = await db.childProfile.create({
        data: { familyId: familyA.familyId, nickname: 'A Child', age: 9 },
      });
      aChildId = aChild.id;

      await db.lessonProgress.create({
        data: { childId: aChild.id, lessonVersionId: version.id, status: 'started' },
      });
    });

    const found = await withRlsContext(
      { userId: familyB.user.id, familyId: familyB.familyId },
      async () => {
        const db = getPrisma();
        return db.lessonProgress.findUnique({
          where: { childId_lessonVersionId: { childId: aChildId, lessonVersionId } },
        });
      }
    );

    expect(found).toBeNull();
  });
});
