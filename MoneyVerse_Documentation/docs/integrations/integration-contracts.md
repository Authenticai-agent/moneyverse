# Integration Contracts

Every external provider requires:

- Purpose
- Feature flag
- Data sent and received
- Authentication method
- Secret-storage method
- Timeout
- Retry and backoff
- Circuit breaker
- Idempotency
- Rate limit
- Webhook verification
- Logging and redaction
- Data retention
- Failure behavior
- Mock adapter
- Disable behavior
- Incident runbook

Provider adapters implement interfaces owned by the domain. Business rules do not depend directly on SDK objects.
