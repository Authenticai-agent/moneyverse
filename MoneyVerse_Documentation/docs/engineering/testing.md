# Testing Strategy

## Unit

Financial formulas, validation schemas, reward rules, authorization policies, age gates, feature flags, and ledger invariants.

## Integration

Authentication, refresh rotation, family membership, RLS, lesson completion, reward issuance, consent, export, deletion, disabled adapters, and webhook verification.

## E2E

Parent registration, login, child creation, protected dashboard, lesson completion, savings goal, classroom join, privacy changes, and logout.

## Security

IDOR, privilege escalation, CSRF, XSS, injection, JWT tampering, refresh replay, rate limits, reward replay, SSRF, open redirect, CSV injection, and disabled-feature bypass.

## Rules

- Use synthetic data only.
- Critical authorization paths cannot be fully mocked.
- Flaky tests must be fixed or quarantined with owner and expiry.
- Do not lower security coverage to pass CI.
