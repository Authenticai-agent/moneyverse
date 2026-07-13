# POST /api/children/:childId/savings-goals

## Authentication
Document required Supabase session.

## Authorization
Document exact policy and relationship.

## Request
Strict runtime schema; reject unknown fields.

## Response
Return only authorized fields.

## Controls
- rate limit
- idempotency where needed
- audit event
- safe error codes
- payload limit
- no secret logging

## Tests
Happy path, invalid input, unauthorized, cross-tenant, replay, and rate limit.
