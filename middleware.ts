import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateCsrfToken, csrfCookieOptions } from './lib/auth/csrf';
import { getClientIp } from './lib/auth/ip';
import { globalRateLimit, dailyQuotaLimit } from './lib/rate-limiter';

const protectedPaths = ['/dashboard', '/family', '/children'];
const authPaths = ['/login', '/register'];

function buildCsp(isDev: boolean, nonce: string) {
  const turnstile = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileOrigin = 'https://challenges.cloudflare.com';
  const scriptExtra = turnstile ? ` ${turnstileOrigin}` : '';
  const connectExtra = turnstile ? ` ${turnstileOrigin}` : '';
  const frameExtra = turnstile ? ` ${turnstileOrigin}` : '';
  // blob: is needed in script-src (not just worker-src) because troika-three-text
  // (drei's <Text>, used for the 3D bucket labels) builds its worker by
  // `importScripts()`-ing a second blob URL from inside the worker itself -
  // worker-src only covers the `new Worker(...)` call, script-src covers what
  // that worker is then allowed to load/execute.
  const scriptSrc = isDev
    ? `script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'nonce-${nonce}' blob:${scriptExtra}`
    : `script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval' blob:${scriptExtra}`;

  // worker-src needs its own entry (blob:) - Rapier's WASM physics engine spins
  // up a Worker from a blob URL, and without this, worker-src falls back to
  // script-src, which doesn't allow blob:, silently blocking the worker.
  return `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' blob:${connectExtra}; worker-src 'self' blob:; frame-src 'self'${frameExtra}; frame-ancestors 'none'; form-action 'self'; base-uri 'self';`;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  const ip = getClientIp(request);

  const globalLimit = globalRateLimit(ip);
  if (!globalLimit.allowed) {
    return new NextResponse('Too many requests', { status: 429, headers: { 'Retry-After': String(globalLimit.retryAfterSeconds) } });
  }

  const dailyLimit = dailyQuotaLimit(ip);
  if (!dailyLimit.allowed) {
    return new NextResponse('Daily quota exceeded', { status: 429, headers: { 'Retry-After': String(dailyLimit.retryAfterSeconds) } });
  }

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuth = authPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuth && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const isDev = process.env.NODE_ENV === 'development';
  const nonce = generateCsrfToken();
  const csp = buildCsp(isDev, nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', csp);
  requestHeaders.set('x-csp-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  if (!request.cookies.get('csrf_token')) {
    response.cookies.set('csrf_token', generateCsrfToken(), csrfCookieOptions());
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|models|textures|draco|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)).*)',
  ],
};
