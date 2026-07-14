import { cookies } from 'next/headers';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyCsrfToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const cookieStore = await cookies();
  const expected = cookieStore.get('csrf_token')?.value;
  if (!expected) return false;
  if (token.length !== expected.length) return false;
  return timingSafeEqual(token, expected);
}
