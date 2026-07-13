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
        publishedVersion: { select: { id: true, version: true } },
      },
      orderBy: [{ minAge: 'asc' }, { title: 'asc' }],
    });

    const progressRecords = await db.lessonProgress.findMany({
      where: {
        childId: child.id,
        version: { lessonId: { in: lessons.map((l) => l.id) } },
      },
      select: {
        status: true,
        lessonVersionId: true,
      },
    });

    const progressByVersionId = new Map(progressRecords.map((p) => [p.lessonVersionId, p.status]));

    const items = lessons.map((lesson) => {
      const versionId = lesson.publishedVersionId;
      const status = versionId ? progressByVersionId.get(versionId) ?? null : null;
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        slug: lesson.slug,
        minAge: lesson.minAge,
        maxAge: lesson.maxAge,
        moduleTitle: lesson.module.title,
        publishedVersionId: versionId,
        progressStatus: status,
      };
    });

    const xp = await getXpBalance(child.id);

    return NextResponse.json({ lessons: items, xp });
  });
}
