# MoneyVerse Database Schema Authority

This document is the human-readable schema source of truth. ORM models and migrations must match it.

## Global rules

- UUID or secure sortable identifiers generated server-side.
- `created_at` and `updated_at` use UTC.
- Money uses integer minor units and ISO currency codes.
- Tenant-owned tables include explicit ownership keys.
- RLS is required as defense in depth.
- Sensitive tokens are encrypted or irreversibly hashed as appropriate.
- Append-only records are never updated through normal application APIs.
- Every migration is recorded in `docs/engineering/migration-log.md`.

## Core tables

### `users`

Adult and staff identities.

Required fields: `id`, normalized email, email-verification state, account status, created timestamp.

Do not store child profiles as ordinary adult users unless a later architecture decision explicitly requires it.

### `user_credentials`

Password hashes and credential metadata.

- One-way Argon2id hash
- Password-change timestamp
- No plaintext or reversible passwords

### `user_sessions`

Server-side session record.

- User ID
- Session status
- Device metadata, minimized
- Created, last-used, and expiry timestamps
- Revocation reason

### `refresh_token_families`

Tracks rotating refresh-token chains and reuse detection.

- Family ID
- User ID
- Session ID
- Current token hash
- Previous-token detection state
- Revoked timestamp and reason

### `families`

Primary private tenant for parent and child data.

### `family_memberships`

Relationship between adult users and families.

Roles: owner, guardian, limited_guardian.

### `child_profiles`

- Family ID
- Non-identifying nickname
- Age (integer, 0–17)
- Avatar configuration reference
- Status
- Privacy settings
- No full birth date by default

### `consent_records`

Append-oriented consent history with policy version, actor, scope, timestamp, and withdrawal state.

### `courses`, `modules`, `lessons`

Versioned curriculum, publication lifecycle, and child mastery.

- `course`: Top-level learning path (e.g., Money Fundamentals).
- `module`: Thematic group within a course.
- `lesson`: A single learning unit with a published version.
- `lesson_version`: Immutable snapshot of a lesson after publication.
- `lesson_progress`: Child's attempt on a specific lesson version.
- `mastery_record`: Evidence-based mastery of a lesson.

Lesson gating uses `min_age` and `max_age` (inclusive) instead of a full birth date.

### `missions`, `mission_assignments`, `mission_completions`

Server-defined assignments and completion evidence.

### `simulated_accounts`

Logical simulated-money account per child and currency.

### `virtual_ledger_entries`

Append-only authoritative movements.

Required fields:

- `id`
- `child_profile_id`
- `simulated_account_id`
- signed `amount_minor`
- `currency`
- `entry_type`
- `source_type`
- optional `source_id`
- unique `idempotency_key`
- `created_at`

Rules:

- No client-supplied reward amount.
- No update or delete through normal APIs.
- Corrections use reversal entries.
- Balance equals the sum of ledger entries.
- Unique constraint prevents duplicate reward issuance.

### `savings_goals`

Child-defined savings targets backed by the immutable ledger.

Required fields:

- `id`
- `child_profile_id`
- `title`
- `target_amount_minor`
- `currency`
- `status` (`active`, `paused`, `completed`, `cancelled`)
- `created_at` / `updated_at`

Rules:

- Progress is computed from ledger entries whose `source_type` is `savings_goal` and `source_id` matches the goal.
- Allocations are debits against the child's simulated cash account.
- A parent can create, read, update, and cancel goals for a child in their family.
- `savings_goals` is tenant-owned and RLS-restricted by family.

### `audit_events`

Append-oriented security and administrative audit events.

Store actor, action, target type, target ID, result, reason code, correlation ID, and redacted metadata.

### `security_events`

Suspicious or policy-relevant events such as token reuse, brute force, impossible reward timing, or cross-tenant access attempts.

### `schools`, `school_memberships`, `classrooms`, `classroom_memberships`

Separate school/classroom scope from family scope.

### `integration_connections`

Provider-neutral external connection record. Disabled integrations must have no active connection rows.

## Schema-change process

1. Update this document.
2. Add or modify ORM schema.
3. Create migration.
4. Add migration log entry.
5. Add authorization and RLS tests.
6. Add data-retention classification.
7. Run migration validation and rollback review.
