# Current Task

## Goal

Security audit and hardening: review API key restrictions, daily quotas, billing alerts, rate limiting, bot protection, and other guardrails, then implement missing protections.

## Status

Implemented and verified.

## Completed work

- Fixed CSRF enforcement: `csrf_token` cookie is set by `middleware.ts`, and `login`, `register`, and `logout` routes verify the token against the cookie and rotate it on success.
- Hardened CSP: per-request nonce for `script-src`, removed `unsafe-inline` from scripts, added `frame-src`, and added `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy` headers.
- Added global and per-IP daily quota rate limits in `middleware.ts` via `lib/rate-limiter.ts` (`GLOBAL_REQUEST_LIMIT_PER_IP`, `DAILY_REQUEST_LIMIT_PER_IP`).
- Added bot protection: honeypot and `Origin`/`Referer` validation, plus optional Cloudflare Turnstile verification in `lib/security/bot.ts` and `app/components/Turnstile.tsx`.
- Added reusable `API_KEY` guard (`lib/security/api-key.ts`) and billing budget guard (`lib/security/billing.ts`).
- Added `.env.example` placeholders for Turnstile, API key, rate limits, and billing limits.
- Fixed edge-runtime crash by moving Node-only `crypto`/`cookies` usage out of `lib/auth/csrf.ts` into a new `lib/auth/csrf-verify.ts` and using Web Crypto API token generation.
- Created `MoneyVerse_Documentation/SECURITY_AUDIT.md` with findings, fixes, and remaining recommendations.
- Confirmed no secrets are exposed in the client bundle and no `NEXT_PUBLIC_` secret variables exist.

## Verification

- `npm run lint` passes with no warnings or errors.
- `npx tsc --noEmit` passes.
- `npm run test` passes (104/104 tests).

## Notes

- Turnstile, API key, and billing guards are optional and only activate when the corresponding environment variables are set.
- Remaining recommendations are documented in `MoneyVerse_Documentation/SECURITY_AUDIT.md` (distributed rate limits, CSP reporting, monitoring, etc.).
