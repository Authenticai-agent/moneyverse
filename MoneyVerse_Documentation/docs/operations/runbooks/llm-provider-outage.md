# LLM Provider Outage Runbook

Applies only when LLM is enabled.

1. Activate deterministic fallback.
2. Stop retries that increase cost or load.
3. Preserve core application functionality.
4. Do not expose provider internals.
5. Re-enable gradually after health checks.
