# User Flows

## Parent registration

1. Adult enters email and password.
2. Server validates and rate-limits.
3. Password is hashed.
4. Family and owner membership are created transactionally.
5. Verification-ready state is recorded.
6. Audit event is written.
7. Session is created.

Failure states must not reveal whether an unrelated account exists beyond normal duplicate-registration behavior.

## Child profile creation

1. Authenticated guardian opens family settings.
2. Server checks family role and consent state.
3. Guardian supplies nickname and age band.
4. Server validates and creates profile.
5. Audit event is recorded.
6. No full date of birth is required.

## Lesson completion

1. Child begins assigned lesson.
2. Server records version.
3. Answers are validated.
4. Mastery is computed server-side.
5. Reward eligibility is calculated.
6. Ledger entry is created once using an idempotency key.
7. Progress and audit records are committed.

## Future Plaid connection

Adult-only, explicit consent, provider Link flow, server token exchange, encrypted token storage, verified webhooks, and easy disconnection.

## Data deletion

Authorized adult requests deletion, reauthenticates, sees impact, receives a request ID, and can track completion. Active sessions are revoked and integrations disconnected.
