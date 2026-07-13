# Plaid Outage Runbook

Applies only when Plaid is enabled.

1. Disable new connection attempts.
2. Preserve core educational functionality.
3. Queue safe retries with backoff.
4. Do not expose provider errors or tokens.
5. Communicate adult-facing status.
6. Reconcile sync cursors after recovery.
