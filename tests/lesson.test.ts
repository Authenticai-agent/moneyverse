import { testApiHandler } from 'next-test-api-route-handler';
import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma, withSystemContext, getPrisma } from '@/lib/prisma';
import * as registerHandler from '@/app/api/auth/register/route';
import * as currentChildrenHandler from '@/app/api/families/current/children/route';
import * as lessonsListHandler from '@/app/api/families/current/children/[childId]/lessons/route';
import * as lessonDetailHandler from '@/app/api/families/current/children/[childId]/lessons/[lessonId]/route';
import * as lessonProgressHandler from '@/app/api/families/current/children/[childId]/lessons/[lessonId]/progress/route';
import * as lessonAnswerHandler from '@/app/api/families/current/children/[childId]/lessons/[lessonId]/answer/route';
import * as childProgressHandler from '@/app/api/families/current/children/[childId]/progress/route';

function findCookie(cookies: Record<string, string>[], name: string): string | undefined {
  for (const jar of cookies) {
    if (name in jar) return jar[name];
  }
  return undefined;
}

async function createParent(email: string) {
  let accessToken: string | undefined;

  await testApiHandler({
    appHandler: registerHandler,
    async test({ fetch }) {
      const res = await fetch({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'securePassword12!' }),
      });
      expect(res.status).toBe(200);
      const cookies = (res as unknown as { cookies: Record<string, string>[] }).cookies;
      accessToken = findCookie(cookies, 'access_token');
    },
  });

  return accessToken!;
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

async function createLesson({
  title,
  slug,
  minAge,
  maxAge,
  content,
}: {
  title: string;
  slug: string;
  minAge: number;
  maxAge: number;
  content: Prisma.InputJsonValue;
}) {
  const course = await prisma.course.create({
    data: { title: 'Test Course', slug: 'test-course', status: 'published' },
  });

  const module = await prisma.module.create({
    data: {
      courseId: course.id,
      title: 'Test Module',
      slug: 'test-module',
      status: 'published',
    },
  });

  const lesson = await prisma.lesson.create({
    data: {
      moduleId: module.id,
      title,
      slug,
      minAge,
      maxAge,
      status: 'published',
    },
  });

  const version = await prisma.lessonVersion.create({
    data: {
      lessonId: lesson.id,
      version: 1,
      content,
      status: 'published',
      publishedAt: new Date(),
    },
  });

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: { publishedVersionId: version.id },
  });

  return lesson.id;
}

describe('Lesson engine', () => {
  it('lists age-appropriate lessons for a child', async () => {
    const accessToken = await createParent('lesson-list@example.com');
    const childId = await createChild(accessToken, 'Sky', 9);
    await createLesson({
      title: 'Saving for a Goal',
      slug: 'saving-for-a-goal',
      minAge: 9,
      maxAge: 12,
      content: { slides: [{ type: 'intro', text: 'Save up.' }] },
    });

    await testApiHandler({
      appHandler: lessonsListHandler,
      paramsPatcher(params) {
        params.childId = childId;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${accessToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.lessons.length).toBe(1);
        expect(json.lessons[0].title).toBe('Saving for a Goal');
      },
    });
  });

  it('excludes lessons outside the child age range', async () => {
    const accessToken = await createParent('lesson-age@example.com');
    const childId = await createChild(accessToken, 'River', 6);
    await createLesson({
      title: 'Saving for a Goal',
      slug: 'saving-for-a-goal',
      minAge: 9,
      maxAge: 12,
      content: { slides: [{ type: 'intro', text: 'Save up.' }] },
    });

    await testApiHandler({
      appHandler: lessonsListHandler,
      paramsPatcher(params) {
        params.childId = childId;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${accessToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.lessons.length).toBe(0);
      },
    });
  });

  it('opens a lesson and creates started progress', async () => {
    const accessToken = await createParent('lesson-open@example.com');
    const childId = await createChild(accessToken, 'Sky', 9);
    const lessonId = await createLesson({
      title: 'Saving for a Goal',
      slug: 'saving-for-a-goal',
      minAge: 9,
      maxAge: 12,
      content: { slides: [{ type: 'intro', text: 'Save up.' }] },
    });

    await testApiHandler({
      appHandler: lessonDetailHandler,
      paramsPatcher(params) {
        params.childId = childId;
        params.lessonId = lessonId;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${accessToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.lesson.title).toBe('Saving for a Goal');
        expect(json.progress.status).toBe('started');
      },
    });

    const events = await withSystemContext(async () => {
      const db = getPrisma();
      return db.auditEvent.findMany({
        where: { action: 'lesson.started', targetId: lessonId },
      });
    });
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].result).toBe('success');
  });

  it('blocks a lesson outside the child age range', async () => {
    const accessToken = await createParent('lesson-gate@example.com');
    const childId = await createChild(accessToken, 'River', 6);
    const lessonId = await createLesson({
      title: 'Saving for a Goal',
      slug: 'saving-for-a-goal',
      minAge: 9,
      maxAge: 12,
      content: { slides: [{ type: 'intro', text: 'Save up.' }] },
    });

    await testApiHandler({
      appHandler: lessonDetailHandler,
      paramsPatcher(params) {
        params.childId = childId;
        params.lessonId = lessonId;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${accessToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(403);
      },
    });
  });

  it('completes a lesson and records progress and mastery', async () => {
    const accessToken = await createParent('lesson-complete@example.com');
    const childId = await createChild(accessToken, 'Sky', 9);
    const lessonId = await createLesson({
      title: 'Saving for a Goal',
      slug: 'saving-for-a-goal',
      minAge: 9,
      maxAge: 12,
      content: { slides: [{ type: 'intro', text: 'Save up.' }] },
    });

    await testApiHandler({
      appHandler: lessonProgressHandler,
      paramsPatcher(params) {
        params.childId = childId;
        params.lessonId = lessonId;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${accessToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.progress.status).toBe('completed');
      },
    });

    const child = await withSystemContext(async () => {
      const db = getPrisma();
      return db.childProfile.findUnique({ where: { id: childId } });
    });
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { publishedVersion: true } });
    const progress = await withSystemContext(async () => {
      const db = getPrisma();
      return db.lessonProgress.findFirst({
        where: { childId, lessonVersionId: lesson?.publishedVersionId ?? undefined },
      });
    });
    expect(progress?.status).toBe('completed');

    const mastery = await withSystemContext(async () => {
      const db = getPrisma();
      return db.masteryRecord.findFirst({
        where: { childId, lessonVersionId: lesson?.publishedVersionId ?? undefined },
      });
    });
    expect(mastery?.status).toBe('achieved');

    const events = await withSystemContext(async () => {
      const db = getPrisma();
      return db.auditEvent.findMany({
        where: { action: 'lesson.completed', targetId: lessonId },
      });
    });
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].result).toBe('success');
  });

  it('submits a correct quiz answer and updates score and mastery', async () => {
    const accessToken = await createParent('lesson-answer@example.com');
    const childId = await createChild(accessToken, 'Sky', 9);
    const lessonId = await createLesson({
      title: 'Quiz Lesson',
      slug: 'quiz-lesson',
      minAge: 9,
      maxAge: 12,
      content: {
        slides: [
          { type: 'quiz', text: 'Is a winter coat a need or a want?', options: ['Need', 'Want'], answer: 'Need' },
        ],
      },
    });

    await testApiHandler({
      appHandler: lessonAnswerHandler,
      paramsPatcher(params) {
        params.childId = childId;
        params.lessonId = lessonId;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${accessToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slideIndex: 0, answer: 'Need' }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.correct).toBe(true);
        expect(json.score).toBe(1);
        expect(json.masteryStatus).toBe('achieved');
      },
    });

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { publishedVersion: true } });
    const progress = await withSystemContext(async () => {
      const db = getPrisma();
      return db.lessonProgress.findFirst({
        where: { childId, lessonVersionId: lesson?.publishedVersionId ?? undefined },
      });
    });
    expect(progress?.score).toBe(1);

    const mastery = await withSystemContext(async () => {
      const db = getPrisma();
      return db.masteryRecord.findFirst({
        where: { childId, lessonVersionId: lesson?.publishedVersionId ?? undefined },
      });
    });
    expect(mastery?.status).toBe('achieved');
  });

  it('submits an incorrect quiz answer and does not achieve mastery', async () => {
    const accessToken = await createParent('lesson-answer-wrong@example.com');
    const childId = await createChild(accessToken, 'Sky', 9);
    const lessonId = await createLesson({
      title: 'Quiz Lesson',
      slug: 'quiz-lesson-wrong',
      minAge: 9,
      maxAge: 12,
      content: {
        slides: [
          { type: 'quiz', text: 'Is a winter coat a need or a want?', options: ['Need', 'Want'], answer: 'Need' },
        ],
      },
    });

    await testApiHandler({
      appHandler: lessonAnswerHandler,
      paramsPatcher(params) {
        params.childId = childId;
        params.lessonId = lessonId;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${accessToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slideIndex: 0, answer: 'Want' }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.correct).toBe(false);
        expect(json.score).toBe(0);
        expect(json.masteryStatus).toBe('in_progress');
      },
    });

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { publishedVersion: true } });
    const mastery = await withSystemContext(async () => {
      const db = getPrisma();
      return db.masteryRecord.findFirst({
        where: { childId, lessonVersionId: lesson?.publishedVersionId ?? undefined },
      });
    });
    expect(mastery?.status).toBe('in_progress');
  });

  it('parent can view progress dashboard for their child', async () => {
    const accessToken = await createParent('progress@example.com');
    const childId = await createChild(accessToken, 'Sky', 9);
    const lessonId = await createLesson({
      title: 'Saving for a Goal',
      slug: 'saving-for-a-goal',
      minAge: 9,
      maxAge: 12,
      content: { slides: [{ type: 'intro', text: 'Save up.' }] },
    });

    await testApiHandler({
      appHandler: lessonProgressHandler,
      paramsPatcher(params) {
        params.childId = childId;
        params.lessonId = lessonId;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${accessToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(200);
      },
    });

    await testApiHandler({
      appHandler: childProgressHandler,
      paramsPatcher(params) {
        params.childId = childId;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${accessToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.child.nickname).toBe('Sky');
        expect(json.child.age).toBe(9);
        expect(json.lessons.length).toBe(1);
        expect(json.lessons[0].progress.status).toBe('completed');
        expect(json.lessons[0].mastery.status).toBe('achieved');
      },
    });
  });

  it('parent cannot access another family child lessons', async () => {
    const parentA = await createParent('lesson-a@example.com');
    const parentB = await createParent('lesson-b@example.com');
    const childB = await createChild(parentB, 'B Child', 9);
    const lessonId = await createLesson({
      title: 'Saving for a Goal',
      slug: 'saving-for-a-goal',
      minAge: 9,
      maxAge: 12,
      content: { slides: [{ type: 'intro', text: 'Save up.' }] },
    });

    await testApiHandler({
      appHandler: lessonsListHandler,
      paramsPatcher(params) {
        params.childId = childB;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${parentA}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(404);
      },
    });

    await testApiHandler({
      appHandler: lessonDetailHandler,
      paramsPatcher(params) {
        params.childId = childB;
        params.lessonId = lessonId;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${parentA}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(404);
      },
    });
  });

  it('awards XP on lesson completion and prevents duplicates', async () => {
    const accessToken = await createParent('xp@example.com');
    const childId = await createChild(accessToken, 'XP Kid', 9);
    const lessonId = await createLesson({
      title: 'XP Lesson',
      slug: 'xp-lesson',
      minAge: 9,
      maxAge: 12,
      content: { slides: [{ type: 'intro', text: 'Earn XP.' }] },
    });

    async function completeLesson() {
      await testApiHandler({
        appHandler: lessonProgressHandler,
        paramsPatcher(params) {
          params.childId = childId;
          params.lessonId = lessonId;
        },
        requestPatcher(request) {
          request.headers.set('cookie', `access_token=${accessToken}`);
        },
        async test({ fetch }) {
          const res = await fetch({ method: 'POST' });
          expect(res.status).toBe(200);
        },
      });
    }

    await completeLesson();

    await testApiHandler({
      appHandler: lessonsListHandler,
      paramsPatcher(params) {
        params.childId = childId;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${accessToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.xp).toBe(50);
      },
    });

    await completeLesson();

    await testApiHandler({
      appHandler: lessonsListHandler,
      paramsPatcher(params) {
        params.childId = childId;
      },
      requestPatcher(request) {
        request.headers.set('cookie', `access_token=${accessToken}`);
      },
      async test({ fetch }) {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.xp).toBe(50);
      },
    });
  });
});
