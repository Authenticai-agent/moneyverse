# Authentication Design

## Adult accounts

- Email and password
- Verification-ready registration
- Password reset
- Optional passkeys
- Optional MFA
- Mandatory production MFA for privileged administrators

## Passwords

Use Argon2id with calibrated cost parameters. Never log or reversibly encrypt passwords.

## Access tokens

- Short lifetime
- Explicit issuer and audience
- Explicit token type
- Algorithm allowlist
- Signature, expiry, and not-before validation
- Unique token ID
- Minimal claims

## Refresh tokens

- Random high-entropy value
- Stored only as a secure, HttpOnly cookie
- Hashed server-side
- Rotated on every use
- Reuse detection
- Token-family revocation
- Session and device management

## CSRF

Cookie-authenticated state changes require CSRF protection using a well-reviewed same-site and token strategy. Do not rely on SameSite alone for every threat model.

## Child access

Initial child access is parent-assisted profile selection. Later child PIN support must include rate limiting, secure hashing, lockout, recovery, and no child email requirement.

## Tests

Wrong issuer, audience, algorithm, signature, expiry, token type, missing claims, replay, revoked session, privilege change, concurrent refresh, logout-all-devices.
