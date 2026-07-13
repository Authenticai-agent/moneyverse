# Webhooks

Every webhook endpoint must define:

- Provider
- Event versions
- Signature algorithm
- Key retrieval and rotation
- Timestamp tolerance
- Replay protection
- Idempotency key
- Payload-size limit
- Schema validation
- Unknown-event behavior
- Retry behavior
- Dead-letter handling
- Redacted logging
- Alert thresholds

Webhook handlers must acknowledge safely, process asynchronously when appropriate, and never trust provider payload fields without verification.
