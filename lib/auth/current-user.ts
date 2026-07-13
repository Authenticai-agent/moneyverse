import { cookies } from 'next/headers';
import { verifyAccessToken } from './tokens';
import { withRlsContext } from '../prisma';
import { COOKIE_REFRESH } from '../config';

export async function requireAccessToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    throw new Error('Unauthorized');
  }

  const claims = await verifyAccessToken(token);

  return withRlsContext({ userId: claims.sub }, async (tx) => {
    const session = await tx.userSession.findUnique({
      where: { id: claims.sessionId },
    });

    if (!session || session.status !== 'active' || session.expiresAt < new Date()) {
      throw new Error('Session invalid');
    }

    const membership = await tx.familyMembership.findFirst({
      where: { userId: claims.sub },
      select: { familyId: true },
    });

    return { claims, familyId: membership?.familyId };
  });
}
