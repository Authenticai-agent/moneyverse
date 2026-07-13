# Threat Model

## Protected assets

- Child identity and learning data
- Parent identity
- Credentials and sessions
- Consent records
- Virtual ledger integrity
- Classroom membership
- Audit logs
- Future Plaid tokens
- Future payment tokens
- Signing and encryption keys

## Threat actors

- External attackers
- Credential stuffers
- Malicious or curious users
- Abusive guardians or teachers
- Compromised administrators
- Malicious dependencies
- Bot operators
- Future prompt-injection attackers
- Insider threats

## Key threats and mitigations

| ID | Threat | Impact | Primary mitigations |
|---|---|---|---|
| T-001 | Cross-family IDOR | Child data exposure | Relationship authorization, scoped queries, RLS, tests |
| T-002 | Account takeover | Full account access | Argon2id, rate limits, MFA, session revocation |
| T-003 | Refresh-token replay | Session theft | Rotation, hashing, reuse detection |
| T-004 | Reward replay | Economy corruption | Idempotency, transactions, append-only ledger |
| T-005 | Stored XSS | Session and data exposure | Validation, encoding, strict CSP, limited free text |
| T-006 | Dependency compromise | Code execution or exfiltration | Lockfile, scanning, review, least privilege |
| T-007 | Admin misuse | Broad exposure | MFA, least privilege, audit, reauthentication |
| T-008 | Join-code brute force | Classroom access | Entropy, expiration, rate limits, approval |
| T-009 | Plaid token leak | Financial-data exposure | Server-only encrypted storage, secret isolation |
| T-010 | Prompt injection | Data/tool abuse | Disabled-by-default AI, tool allowlists, schema checks, human approval |

## Review cadence

Review after every major feature, integration, role change, data-classification change, or security incident.
