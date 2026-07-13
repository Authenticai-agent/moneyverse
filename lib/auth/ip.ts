import { NextRequest } from 'next/server';

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  return (real ?? forwarded?.split(',')[0]?.trim() ?? 'unknown') || 'unknown';
}
