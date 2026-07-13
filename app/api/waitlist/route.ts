import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limiter';

const schema = z.object({
  email: z.string().email(),
  interest: z.enum(['parent', 'teacher']),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const limit = rateLimit({ key: `waitlist:${ip}`, maxRequests: 5, windowSeconds: 3600 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  await prisma.waitlistEntry.upsert({
    where: { email: parsed.data.email },
    update: { interest: parsed.data.interest },
    create: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
