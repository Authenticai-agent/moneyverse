# Observability

## Logs

Use structured logs with correlation IDs and redaction. Never log credentials, tokens, secrets, full sensitive payloads, or child free text by default.

## Metrics

- Authentication success/failure
- Rate-limit triggers
- Session revocation
- Cross-tenant denial
- Reward issuance and replay prevention
- Job failures
- API latency and errors
- Data-export volume
- Integration failures
- Security-event volume

## Alerts

Alerts need owner, severity, threshold, runbook, and quieting rules. Avoid exposing child or financial data in alert payloads.

## Traces

Trace service boundaries using pseudonymous identifiers. Restrict access and retention.
