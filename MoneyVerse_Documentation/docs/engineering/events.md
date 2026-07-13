# Events

## Event classes

- Domain events
- Audit events
- Security events
- Analytics events
- Integration events

## Required metadata

- Event ID
- Event type and version
- Timestamp
- Correlation ID
- Producer
- Tenant scope
- Actor ID where appropriate
- Subject ID where appropriate
- Redacted payload
- Idempotency key where relevant

## Initial events

- `family.created.v1`
- `family.membership.created.v1`
- `child_profile.created.v1`
- `lesson.started.v1`
- `lesson.completed.v1`
- `mission.completed.v1`
- `ledger.reward_issued.v1`
- `session.created.v1`
- `session.revoked.v1`
- `refresh_token.reuse_detected.v1`
- `consent.granted.v1`
- `consent.withdrawn.v1`
- `integration.disconnected.v1`

Events must be versioned and backward-compatible for active consumers.
