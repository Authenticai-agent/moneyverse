import { NextResponse } from 'next/server';
import { requireAccessToken } from '@/lib/auth/current-user';

export async function GET() {
  try {
    const { claims } = await requireAccessToken();
    return NextResponse.json({
      user: { id: claims.sub, email: claims.email },
    });
  } catch {
    return NextResponse.json({ error: 'auth.unauthorized' }, { status: 401 });
  }
}
