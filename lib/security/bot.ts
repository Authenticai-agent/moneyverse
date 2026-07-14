function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getTurnstileToken(body: unknown): string | undefined {
  if (!isPlainObject(body)) return undefined;
  const value = body['cf-turnstile-response'] ?? body['turnstileToken'];
  return typeof value === 'string' ? value : undefined;
}

export function verifyHoneypot(body: unknown): boolean {
  if (!isPlainObject(body)) return false;
  const value = body['website'];
  return value === undefined || value === '' || value === null;
}

export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    });
    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
    return data.success === true;
  } catch {
    return false;
  }
}

export function verifyOrigin(request: Request): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return true;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const expected = new URL(siteUrl).origin;

  if (origin) {
    return origin === expected;
  }
  if (referer) {
    return new URL(referer).origin === expected;
  }
  return false;
}
