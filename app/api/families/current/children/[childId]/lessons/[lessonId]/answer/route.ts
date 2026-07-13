import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getPrisma, withRlsContext } from '@/lib/prisma';
import { requireAccessToken } from '@/lib/auth/current-user';
import { isGuardianInFamily } from '@/lib/auth/authorization';
import { auditEvent } from '@/lib/audit';
import { answerSchema } from '@/lib/schemas/curriculum';

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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { slideIndex, answer } = parsed.data;

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
        action: 'lesson.answered',
        targetType: 'lesson',
        targetId: lesson.id,
        result: 'blocked',
        reasonCode: 'age_gated',
        metadata: { childId: child.id, age: child.age },
      });
      return NextResponse.json({ error: 'lesson.age_gated' }, { status: 403 });
    }

    const content = lesson.publishedVersion.content as {
      slides?: Array<{ type?: string; text?: string; options?: string[]; answer?: string }>;
    };
    const slides = content.slides ?? [];
    const slide = slides[slideIndex];

    if (!slide || slide.answer === undefined) {
      await auditEvent({
        actorId: claims.sub,
        action: 'lesson.answered',
        targetType: 'lesson',
        targetId: lesson.id,
        result: 'blocked',
        reasonCode: 'invalid_slide',
        metadata: { childId: child.id, slideIndex },
      });
      return NextResponse.json({ error: 'lesson.invalid_slide' }, { status: 400 });
    }

    const expectedAnswer = String(slide.answer).trim().toLowerCase();
    const givenAnswer = answer.trim().toLowerCase();
    const correct = expectedAnswer === givenAnswer;

    const publishedVersionId = lesson.publishedVersion.id;

    let progress = await db.lessonProgress.findUnique({
      where: {
        childId_lessonVersionId: {
          childId: child.id,
          lessonVersionId: publishedVersionId,
        },
      },
    });

    if (!progress) {
      progress = await db.lessonProgress.create({
        data: {
          childId: child.id,
          lessonVersionId: publishedVersionId,
          status: 'started',
        },
      });
    }

    const quizSlides = slides.filter((s) => s.answer !== undefined);
    const quizSlideCount = quizSlides.length;

    const existingMastery = await db.masteryRecord.findUnique({
      where: {
        childId_lessonVersionId: {
          childId: child.id,
          lessonVersionId: publishedVersionId,
        },
      },
    });

    const evidence = (existingMastery?.evidence as { answers?: unknown[] } | null) ?? { answers: [] };
    const answers = Array.isArray(evidence.answers) ? evidence.answers : [];
    answers.push({
      slideIndex,
      answer,
      correct,
      answeredAt: new Date().toISOString(),
    });

    const correctSlides = new Set(
      answers
        .filter((entry: any) => entry?.correct === true)
        .map((entry: any) => entry?.slideIndex)
    );
    const score = correctSlides.size;

    await db.lessonProgress.update({
      where: { id: progress.id },
      data: { score },
    });

    const masteryStatus = quizSlideCount > 0 && score >= quizSlideCount ? 'achieved' : 'in_progress';

    await db.masteryRecord.upsert({
      where: {
        childId_lessonVersionId: {
          childId: child.id,
          lessonVersionId: publishedVersionId,
        },
      },
      update: {
        status: masteryStatus,
        evidence: { answers } as Prisma.InputJsonValue,
      },
      create: {
        childId: child.id,
        lessonVersionId: publishedVersionId,
        status: masteryStatus,
        evidence: { answers } as Prisma.InputJsonValue,
      },
    });

    await auditEvent({
      actorId: claims.sub,
      action: 'lesson.answered',
      targetType: 'lesson',
      targetId: lesson.id,
      result: correct ? 'success' : 'failure',
      metadata: { childId: child.id, slideIndex, correct, lessonVersionId: publishedVersionId },
    });

    return NextResponse.json({
      correct,
      score,
      quizSlideCount,
      masteryStatus,
    });
  });
}
