import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';

const protectedPaths = ['/dashboard', '/family', '/children'];
const authPaths = ['/login', '/register'];

function buildCsp(nonce: string, isDev: boolean) {
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' 'unsafe-inline'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'`;

  return (
    "default-src 'self'; " +
    `${scriptSrc}; ` +
    "style-src 'self' 'nonce-${nonce}' 'unsafe-inline'; " +
    "img-src 'self' data:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'; " +
    "form-action 'self'; " +
    "base-uri 'self';"
  ).replace('${nonce}', nonce);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuth = authPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuth && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const nonce = randomBytes(16).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';
  const csp = buildCsp(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: ['/:path*'],
  runtime: 'nodejs',
};
