import { NextResponse } from 'next/server';
import { getPrisma, withRlsContext } from '@/lib/prisma';
import { requireAccessToken } from '@/lib/auth/current-user';
import { isGuardianInFamily } from '@/lib/auth/authorization';
import { getXpBalance } from '@/lib/rewards/xp';

export async function GET(request: Request, context: { params: Promise<{  childId: string  }> }) {
  const params = await context.params;
  let claims;
  let familyId;
  try {
    ({ claims, familyId } = await requireAccessToken());
  } catch {
    return NextResponse.json({ error: 'auth.unauthorized' }, { status: 401 });
  }

  if (!familyId) {
    return NextResponse.json({ error: 'no_family' }, { status: 404 });
  }

  return withRlsContext({ userId: claims.sub, familyId }, async () => {
    const db = getPrisma();

    const authorized = await isGuardianInFamily(claims.sub, familyId);
    if (!authorized) {
      return NextResponse.json({ error: 'auth.forbidden' }, { status: 403 });
    }

    const child = await db.childProfile.findFirst({
      where: { id: params.childId, familyId, status: 'active' },
    });

    if (!child) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const lessons = await db.lesson.findMany({
      where: {
        status: 'published',
        publishedVersionId: { not: null },
        minAge: { lte: child.age },
        maxAge: { gte: child.age },
      },
      include: {
        module: { select: { title: true } },
        publishedVersion: { select: { id: true } },
      },
      orderBy: [{ minAge: 'asc' }, { title: 'asc' }],
    });

    const lessonVersionIds = lessons.map((l) => l.publishedVersionId).filter(Boolean) as string[];

    const progressRecords = await db.lessonProgress.findMany({
      where: { childId: child.id, lessonVersionId: { in: lessonVersionIds } },
    });

    const masteryRecords = await db.masteryRecord.findMany({
      where: { childId: child.id, lessonVersionId: { in: lessonVersionIds } },
    });

    const progressByVersionId = new Map(progressRecords.map((p) => [p.lessonVersionId, p]));
    const masteryByVersionId = new Map(masteryRecords.map((m) => [m.lessonVersionId, m]));

    const items = lessons.map((lesson) => {
      const versionId = lesson.publishedVersionId!;
      const progress = progressByVersionId.get(versionId);
      const mastery = masteryByVersionId.get(versionId);

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        moduleTitle: lesson.module.title,
        minAge: lesson.minAge,
        maxAge: lesson.maxAge,
        progress: progress
          ? {
              status: progress.status,
              score: progress.score,
              startedAt: progress.startedAt,
              completedAt: progress.completedAt,
            }
          : null,
        mastery: mastery
          ? {
              status: mastery.status,
              evidence: mastery.evidence,
            }
          : null,
      };
    });

    const xp = await getXpBalance(child.id);

    return NextResponse.json({
      child: {
        id: child.id,
        nickname: child.nickname,
        age: child.age,
      },
      lessons: items,
      xp,
    });
  });
}
