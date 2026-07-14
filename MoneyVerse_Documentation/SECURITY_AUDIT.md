# Security Audit — 2026-07-14

## Scope
Review API key restrictions, daily quotas, billing alerts, rate limiting, bot protection, and other application guardrails for the MoneyVerse web app.

## Existing controls (verified in code)
- **Authentication**: Argon2id password hashing, JWT access tokens with issuer/audience/exp/type checks, refresh-token rotation with family reuse detection, session expiry and revocation.
- **Authorization**: Relationship-based checks (`isGuardianInFamily`), scoped queries, and Prisma Row-Level Security (RLS) context via `AsyncLocalStorage`.
- **Rate limiting**: In-memory fixed-window limits on `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, `/api/waitlist`, and `/api/families/current/children` POST.
- **Audit logging**: `auditEvent` with redaction of sensitive metadata; security events also logged to `SecurityEvent`.
- **Input validation**: Zod schemas in `lib/schemas/auth.ts` and route handlers.
- **Security headers**: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy in `next.config.js` and `netlify.toml`.
- **CSP**: Per-request nonce-based CSP generated in `middleware.ts`.
- **RLS tests**: `tests/rls.test.ts`, `tests/security.test.ts`, `tests/security-headers.test.ts` enforce access isolation, header presence, and secret non-exposure.
- **Disabled risky features**: `LLM_ENABLED`, `PLAID_ENABLED`, `PAYMENTS_ENABLED`, `ANALYTICS_ENABLED` default to `false`.

## Missing or weak controls (implemented during this audit)
1. **CSRF verification was not actually enforced**: `csrfToken` was sent as a hardcoded value and not compared to the cookie.
   - Fix: `middleware.ts` now sets a `csrf_token` cookie. `login`, `register`, and `logout` routes verify the token against the cookie in `lib/auth/csrf-verify.ts` and rotate it on success.
2. **CSP used `unsafe-inline` for scripts**: made XSS policy ineffective.
   - Fix: middleware now generates a per-request nonce for `script-src`; `style-src` still allows `unsafe-inline` because Tailwind/CSS-in-JS requires it. `img-src` and `connect-src` also allow `blob:` so Three.js GLTFLoader textures load.
3. **No global or daily per-IP rate limits / quotas**: only per-action limits existed.
   - Fix: `middleware.ts` now applies `globalRateLimit` (200 req/min per IP) and `dailyQuotaLimit` (1000 req/day per IP) from `lib/rate-limiter.ts`.
4. **No bot protection**: public endpoints (`login`, `register`, `waitlist`) were vulnerable to automated abuse.
   - Fix: `lib/security/bot.ts` adds honeypot detection, `Origin`/`Referer` validation, and optional Cloudflare Turnstile verification. `Turnstile.tsx` widget renders when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set. Login, register, and waitlist forms include the honeypot and Turnstile token.
5. **No API-key/billing guardrail helpers**: future paid or internal APIs had no reusable guard.
   - Fix: added `lib/security/api-key.ts` (`requireApiKey`) and `lib/security/billing.ts` (`checkBillingBudget`) with `.env.example` placeholders.
6. **Edge runtime crash**: `lib/auth/csrf.ts` imported Node.js `crypto`, which does not load in the Next.js middleware edge runtime.
   - Fix: token generation now uses the Web Crypto API (`crypto.getRandomValues`), and `verifyCsrfToken` moved to `lib/auth/csrf-verify.ts`.

## API key / secret exposure audit
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` are public by design; no secrets (JWT, DB, service keys) are exposed to the client.
- `.env.example` was updated with new optional security variables: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `API_KEY`, `GLOBAL_REQUEST_LIMIT_PER_IP`, `DAILY_REQUEST_LIMIT_PER_IP`, `BILLING_LIMIT`, `BILLING_ALERT_THRESHOLD`.

## Verification
- `npm run lint` — passed
- `npx tsc --noEmit` — passed
- `npm run test` — 104/104 passed

## Remaining manual recommendations
- Configure Turnstile in production and set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`.
- Set `GLOBAL_REQUEST_LIMIT_PER_IP` and `DAILY_REQUEST_LIMIT_PER_IP` to values appropriate for your traffic.
- Set `API_KEY` for any future server-to-server or admin endpoints, and apply `requireApiKey` in those routes.
- Set `BILLING_LIMIT` and `BILLING_ALERT_THRESHOLD` before enabling any paid API (LLM/Plaid/payments), and call `checkBillingBudget` before each paid call.
- Add CSP reporting endpoints (`report-uri`/`report-to`) if you want real-time CSP violation telemetry.
- For a production deployment, use a distributed rate limit store (Redis/Upstash) instead of the in-memory `Map` so limits survive horizontal scaling.
- Periodically review `SecurityEvent` and `AuditEvent` tables for abuse patterns.

## Files changed
- `middleware.ts`
- `next.config.js` / `netlify.toml` (no edits, reviewed)
- `lib/auth/csrf.ts`
- `lib/auth/csrf-verify.ts` (new)
- `lib/auth/cookies.ts` (no edits, reviewed)
- `lib/rate-limiter.ts`
- `lib/security/bot.ts` (new)
- `lib/security/api-key.ts` (new)
- `lib/security/billing.ts` (new)
- `app/components/Turnstile.tsx` (new)
- `app/components/JsonLd.tsx`
- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/waitlist/route.ts`
- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/dashboard/page.tsx`
- `app/components/WaitlistSection.tsx`
- `.env.example`
- `tests/auth.test.ts`
- `tests/family.test.ts`
- `tests/lesson.test.ts`
- `tests/security-headers.test.ts`
- `MoneyVerse_Documentation/SECURITY_AUDIT.md` (new)
