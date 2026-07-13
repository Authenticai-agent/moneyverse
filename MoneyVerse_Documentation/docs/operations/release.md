# Release Process

## Required gates

- Acceptance criteria complete
- Documentation updated
- Lint, type-check, build, and tests pass
- No unresolved critical vulnerability
- Migration reviewed
- Rollback tested
- Feature flags verified
- Privacy and child-safety impact reviewed
- Launch checklist status reviewed

## Rollout

Use staged rollout for high-risk features. Keep a server-side kill switch. Monitor defined health and abuse metrics.

## Release notes

Record user-visible additions, changes, fixes, security improvements, deprecations, and removals. Do not disclose exploitable detail before remediation.
