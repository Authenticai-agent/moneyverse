# Deployment

## Environments

Development, staging, and production use separate databases, secrets, storage, domains, and provider credentials.

## Production controls

- Private database networking
- TLS
- HSTS
- WAF/CDN protections
- Managed secrets
- Least-privilege service accounts
- Protected deployment workflow
- Health checks
- Migration approval
- Rollback plan
- Security and error monitoring

## Deployment sequence

1. Validate configuration.
2. Run tests and security scans.
3. Build immutable artifact.
4. Back up and verify restore readiness.
5. Apply reviewed migration.
6. Deploy behind feature flags.
7. Run smoke tests.
8. Monitor errors, latency, and security events.
9. Roll back on defined thresholds.
