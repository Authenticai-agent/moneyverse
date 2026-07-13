import { NextResponse } from 'next/server';
import { getPrisma, withRlsContext } from '@/lib/prisma';
import { requireAccessToken } from '@/lib/auth/current-user';
import { isGuardianInFamily } from '@/lib/auth/authorization';
import { auditEvent } from '@/lib/audit';

export async function GET(request: Request, context: { params: Promise<{  childId: string; lessonId: string  }> }) {
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

    const lesson = await db.lesson.findFirst({
      where: {
        id: params.lessonId,
        status: 'published',
        publishedVersionId: { not: null },
      },
      include: {
        publishedVersion: {
          select: { id: true, version: true, content: true },
        },
      },
    });

    if (!lesson || !lesson.publishedVersion) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (child.age < lesson.minAge || child.age > lesson.maxAge) {
      await auditEvent({
        actorId: claims.sub,
        action: 'lesson.started',
        targetType: 'lesson',
        targetId: lesson.id,
        result: 'blocked',
        reasonCode: 'age_gated',
        metadata: { childId: child.id, age: child.age },
      });
      return NextResponse.json({ error: 'lesson.age_gated' }, { status: 403 });
    }

    let progress = await db.lessonProgress.findUnique({
      where: {
        childId_lessonVersionId: {
          childId: child.id,
          lessonVersionId: lesson.publishedVersion.id,
        },
      },
    });

    if (!progress) {
      progress = await db.lessonProgress.create({
        data: {
          childId: child.id,
          lessonVersionId: lesson.publishedVersion.id,
          status: 'started',
        },
      });

      await auditEvent({
        actorId: claims.sub,
        action: 'lesson.started',
        targetType: 'lesson',
        targetId: lesson.id,
        result: 'success',
        metadata: { childId: child.id, lessonVersionId: lesson.publishedVersion.id },
      });
    }

    return NextResponse.json({
      lesson: {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        slug: lesson.slug,
        minAge: lesson.minAge,
        maxAge: lesson.maxAge,
        content: lesson.publishedVersion.content,
      },
      progress: {
        id: progress.id,
        status: progress.status,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
        lessonVersionId: progress.lessonVersionId,
      },
    });
  });
}
