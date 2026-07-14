import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

const nextConfig = require('../next.config.js');

function findHeader(headers: { key: string; value: string }[], key: string) {
  return headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;
}

describe('Security headers', () => {
  it('configures baseline security headers for all routes', async () => {
    const rules = await nextConfig.headers();

    const rule = rules.find((r: { source: string }) => r.source === '/(.*)');
    expect(rule).toBeTruthy();

    const headers = rule.headers as { key: string; value: string }[];
    expect(findHeader(headers, 'X-Frame-Options')).toBe('DENY');
    expect(findHeader(headers, 'X-Content-Type-Options')).toBe('nosniff');
    expect(findHeader(headers, 'Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(findHeader(headers, 'Strict-Transport-Security')).toBe('max-age=63072000; includeSubDomains; preload');
    expect(findHeader(headers, 'Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=(), interest-cohort=()');
  });

  it('generates a nonce-based Content-Security-Policy per request', () => {
    const request = new NextRequest('http://localhost:3000/');
    const response = middleware(request);
    expect(response).toBeTruthy();

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).toContain("'wasm-unsafe-eval'");
    expect(csp).toMatch(/nonce-/);
  });

  it('sets cross-origin isolation headers', () => {
    const request = new NextRequest('http://localhost:3000/');
    const response = middleware(request);
    expect(response).toBeTruthy();
    expect(response.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(response.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
  });
});
