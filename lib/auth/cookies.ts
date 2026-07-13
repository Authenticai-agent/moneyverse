import { cookies } from 'next/headers';
import { COOKIE_REFRESH, COOKIE_CSRF } from '../config';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 15 * 60, // 15 minutes
};

const csrfCookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

export async function setAccessCookie(token: string) {
  (await cookies()).set('access_token', token, accessCookieOptions);
}

export async function getAccessCookie(): Promise<string | undefined> {
  return (await cookies()).get('access_token')?.value;
}

export async function deleteAccessCookie() {
  (await cookies()).delete('access_token');
}

export async function setRefreshCookie(token: string) {
  (await cookies()).set(COOKIE_REFRESH, token, refreshCookieOptions);
}

export async function getRefreshCookie(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE_REFRESH)?.value;
}

export async function deleteRefreshCookie() {
  (await cookies()).delete(COOKIE_REFRESH);
}

export async function setCsrfCookie(token: string) {
  (await cookies()).set(COOKIE_CSRF, token, csrfCookieOptions);
}

export async function getCsrfCookie(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE_CSRF)?.value;
}

export async function deleteCsrfCookie() {
  (await cookies()).delete(COOKIE_CSRF);
}
