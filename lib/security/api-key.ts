import { NextResponse } from 'next/server';

export function requireApiKey(request: Request): NextResponse | null {
  const expected = process.env.API_KEY;
  if (!expected) return null;

  const provided = request.headers.get('x-api-key');
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return null;
}
