import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getPrisma, withRlsContext } from '@/lib/prisma';
import { requireAccessToken } from '@/lib/auth/current-user';
import { isGuardianInFamily } from '@/lib/auth/authorization';
import { auditEvent } from '@/lib/audit';
import { awardLessonXp } from '@/lib/rewards/xp';

export async function POST(request: Request, context: { params: Promise<{  childId: string; lessonId: string  }> }) {
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
          select: { id: true, content: true },
        },
      },
    });

    if (!lesson || !lesson.publishedVersion) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (child.age < lesson.minAge || child.age > lesson.maxAge) {
      await auditEvent({
        actorId: claims.sub,
        action: 'lesson.completed',
        targetType: 'lesson',
        targetId: lesson.id,
        result: 'blocked',
        reasonCode: 'age_gated',
        metadata: { childId: child.id, age: child.age },
      });
      return NextResponse.json({ error: 'lesson.age_gated' }, { status: 403 });
    }

    const publishedVersion = lesson.publishedVersion;
    const publishedVersionId = publishedVersion.id;

    const progress = await db.lessonProgress.upsert({
      where: {
        childId_lessonVersionId: {
          childId: child.id,
          lessonVersionId: publishedVersionId,
        },
      },
      update: {
        status: 'completed',
        completedAt: new Date(),
      },
      create: {
        childId: child.id,
        lessonVersionId: publishedVersionId,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    const content = publishedVersion.content as {
      slides?: Array<{ type?: string; options?: string[]; answer?: string }>;
    };
    const slides = content.slides ?? [];
    const quizSlideCount = slides.filter((s) => s.answer !== undefined).length;
    const score = progress.score ?? 0;
    const masteryStatus = quizSlideCount === 0 || score >= quizSlideCount ? 'achieved' : 'in_progress';

    const existingMastery = await db.masteryRecord.findUnique({
      where: {
        childId_lessonVersionId: {
          childId: child.id,
          lessonVersionId: publishedVersionId,
        },
      },
    });

    const evidence = (existingMastery?.evidence as { answers?: unknown[]; completedAt?: string } | null) ?? { answers: [] };
    const updatedEvidence = {
      answers: evidence.answers ?? [],
      completedAt: progress.completedAt?.toISOString() ?? new Date().toISOString(),
    };

    await db.masteryRecord.upsert({
      where: {
        childId_lessonVersionId: {
          childId: child.id,
          lessonVersionId: publishedVersionId,
        },
      },
      update: {
        status: masteryStatus,
        evidence: updatedEvidence as Prisma.InputJsonValue,
      },
      create: {
        childId: child.id,
        lessonVersionId: publishedVersionId,
        status: masteryStatus,
        evidence: updatedEvidence as Prisma.InputJsonValue,
      },
    });

    await auditEvent({
      actorId: claims.sub,
      action: 'lesson.completed',
      targetType: 'lesson',
      targetId: lesson.id,
      result: 'success',
      metadata: { childId: child.id, lessonVersionId: publishedVersionId },
    });

    await awardLessonXp(child.id, publishedVersionId, claims.sub);

    return NextResponse.json({
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
