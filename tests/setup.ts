import { beforeEach, afterAll } from 'vitest';
import { prisma, withSystemContext, getPrisma } from '@/lib/prisma';
import { resetRateLimit } from '@/lib/rate-limiter';

beforeEach(async () => {
  resetRateLimit();
  await withSystemContext(async () => {
    const db = getPrisma();
    await db.virtualLedgerEntry.deleteMany();
    await db.simulatedAccount.deleteMany();
    await db.securityEvent.deleteMany();
    await db.auditEvent.deleteMany();
    await db.masteryRecord.deleteMany();
    await db.lessonProgress.deleteMany();
    await db.childProfile.deleteMany();
    await db.familyMembership.deleteMany();
    await db.family.deleteMany();
    await db.lessonVersion.deleteMany();
    await db.lesson.deleteMany();
    await db.module.deleteMany();
    await db.course.deleteMany();
    await db.refreshTokenFamily.deleteMany();
    await db.userSession.deleteMany();
    await db.userCredential.deleteMany();
    await db.user.deleteMany();
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
