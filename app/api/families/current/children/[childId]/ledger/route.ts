import { NextResponse } from 'next/server';
import { getPrisma, withRlsContext } from '@/lib/prisma';
import { requireAccessToken } from '@/lib/auth/current-user';
import { isGuardianInFamily } from '@/lib/auth/authorization';
import { getBalance, getEntries } from '@/lib/ledger';

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

    const url = new URL(request.url);
    const currency = url.searchParams.get('currency') ?? 'simulated_cash';

    const [entries, balance] = await Promise.all([
      getEntries(child.id, currency),
      getBalance(child.id, currency),
    ]);

    return NextResponse.json({
      currency,
      balance,
      entries: entries.map((entry) => ({
        id: entry.id,
        amountMinor: entry.amountMinor,
        entryType: entry.entryType,
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
        idempotencyKey: entry.idempotencyKey,
        metadata: entry.metadata,
        createdAt: entry.createdAt,
      })),
    });
  });
}
