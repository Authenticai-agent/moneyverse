# Security Policy

## Principles

- Deny by default
- Least privilege
- Defense in depth
- Data minimization
- Secure defaults
- Explicit trust boundaries
- Tamper-evident auditability
- Safe failure
- Reversible deployment

## Required controls

- Strong authentication
- Relationship-based authorization
- RLS on tenant-owned data
- Runtime input validation
- Parameterized database access
- Secure headers and CSP
- CSRF protection
- Rate limiting
- Secret management
- Dependency and supply-chain scanning
- Encrypted transport and storage
- Backups and restore testing
- Incident response
- Security logging without sensitive content

## Prohibited patterns

- Secrets in client bundles
- Tokens in localStorage for long-lived sessions
- Raw SQL interpolation
- Dynamic code execution
- Arbitrary shell execution
- Unrestricted SSRF-capable fetch endpoints
- Authorization based on hidden UI
- Silent security exceptions
- Disabling tests to ship
