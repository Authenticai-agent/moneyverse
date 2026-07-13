import { getPrisma } from '../prisma';

export async function isGuardianInFamily(userId: string, familyId: string): Promise<boolean> {
  const db = getPrisma();
  const membership = await db.familyMembership.findFirst({
    where: {
      userId,
      familyId,
      role: { in: ['owner', 'guardian'] },
    },
  });
  return membership !== null;
}

export async function isOwnerInFamily(userId: string, familyId: string): Promise<boolean> {
  const db = getPrisma();
  const membership = await db.familyMembership.findFirst({
    where: {
      userId,
      familyId,
      role: 'owner',
    },
  });
  return membership !== null;
}
