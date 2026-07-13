# API Contracts

## Required contract fields

For each route document:

- Method and path
- Authentication
- Authorization policy
- Feature flag
- Request schema
- Response schema
- Error codes
- Rate limit
- Idempotency
- Audit event
- Data classification

## Example

### `POST /api/families/:familyId/children`

Authentication: Adult session  
Authorization: `child_profile.create` on family  
Feature flag: Core  
Rate limit: Per account and IP  
Audit: `child_profile.created`

Request:

```json
{
  "nickname": "Sky",
  "ageBand": "9_12"
}
```

The server ignores or rejects unexpected fields. The client cannot provide family ownership, permissions, XP, balance, or identifiers.

Response includes only fields the requester is authorized to view.

## Error principles

- Stable error codes
- Safe human messages
- No stack traces
- No secret or database details
- Avoid resource-enumeration leaks
